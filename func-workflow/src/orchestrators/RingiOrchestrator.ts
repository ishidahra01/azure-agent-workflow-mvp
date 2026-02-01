/**
 * Ringi Workflow Orchestrator
 * 
 * This orchestrator manages the complete workflow for processing Ringi (approval) documents:
 * 1. Extract text from input
 * 2. Generate search query using LLM
 * 3. Search for precedent documents
 * 4. Validate content using LLM
 * 5. If validation fails, wait for human fix (Human-in-the-Loop)
 * 6. Generate draft using LLM
 * 7. Wait for draft approval (Human-in-the-Loop)
 * 8. Submit to internal system
 * 9. Poll for submission status
 */

import { app } from '@azure/functions';
import * as df from 'durable-functions';
import { OrchestrationContext, OrchestrationHandler } from 'durable-functions';
import {
  WorkflowInput,
  WorkflowState,
  WorkflowStep,
  WorkflowOutput,
  HumanFixInput,
  DraftApprovalInput,
} from '../shared/models';
import { config } from '../shared/config';
import { ExtractTextInput, ExtractTextOutput } from '../activities/ExtractTextActivity';
import { LlmGenerateSearchQueryInput, LlmGenerateSearchQueryOutput } from '../activities/LlmGenerateSearchQueryActivity';
import { CallMockSearchInput, CallMockSearchOutput } from '../activities/CallMockSearchActivity';
import { LlmValidateContentInput, LlmValidateContentOutput } from '../activities/LlmValidateContentActivity';
import { LlmGenerateDraftInput, LlmGenerateDraftOutput } from '../activities/LlmGenerateDraftActivity';
import { CallMockInternalSubmitInput, CallMockInternalSubmitOutput } from '../activities/CallMockInternalSubmitActivity';
import { CallMockInternalStatusInput, CallMockInternalStatusOutput } from '../activities/CallMockInternalStatusActivity';

const ringiOrchestrator: OrchestrationHandler = function* (
  context: OrchestrationContext
): Generator<any, WorkflowOutput, any> {
  const input: WorkflowInput = context.df.getInput();
  
  // Initialize workflow state
  const state: WorkflowState = {
    documentId: input.documentId,
    requestorId: input.requestorId,
    currentStep: WorkflowStep.STARTED,
    errors: [],
    retryCount: 0,
    startTime: context.df.currentUtcDateTime.toISOString(),
    lastUpdateTime: context.df.currentUtcDateTime.toISOString(),
  };

  try {
    // Step 1: Extract text from input document
    state.currentStep = WorkflowStep.EXTRACTING_TEXT;
    context.df.setCustomStatus(state);
    
    const extractTextInput: ExtractTextInput = {
      rawContent: input.rawContent,
      documentId: input.documentId,
    };
    
    const extractResult: ExtractTextOutput = yield context.df.callActivity(
      'ExtractTextActivity',
      extractTextInput
    );
    state.extractedText = extractResult.extractedText;

    // Step 2: Generate search query using LLM
    state.currentStep = WorkflowStep.GENERATING_SEARCH_QUERY;
    state.lastUpdateTime = context.df.currentUtcDateTime.toISOString();
    context.df.setCustomStatus(state);
    
    const searchQueryInput: LlmGenerateSearchQueryInput = {
      extractedText: state.extractedText,
    };
    
    const searchQueryResult: LlmGenerateSearchQueryOutput = yield context.df.callActivity(
      'LlmGenerateSearchQueryActivity',
      searchQueryInput
    );
    state.searchQuery = searchQueryResult.searchQuery;

    // Step 3: Search for precedent documents
    state.currentStep = WorkflowStep.SEARCHING_PRECEDENTS;
    state.lastUpdateTime = context.df.currentUtcDateTime.toISOString();
    context.df.setCustomStatus(state);
    
    const searchInput: CallMockSearchInput = {
      searchQuery: state.searchQuery,
    };
    
    const searchResult: CallMockSearchOutput = yield context.df.callActivity(
      'CallMockSearchActivity',
      searchInput
    );
    state.searchResults = searchResult.searchResults;

    // Step 4: Validate content using LLM
    let validationPassed = false;
    let validationAttempts = 0;
    const maxValidationAttempts = 3; // Prevent infinite loops
    
    while (!validationPassed && validationAttempts < maxValidationAttempts) {
      state.currentStep = WorkflowStep.VALIDATING_CONTENT;
      state.lastUpdateTime = context.df.currentUtcDateTime.toISOString();
      context.df.setCustomStatus(state);
      
      const validationInput: LlmValidateContentInput = {
        extractedText: state.extractedText!,
        searchResults: state.searchResults!,
      };
      
      const validationResult: LlmValidateContentOutput = yield context.df.callActivity(
        'LlmValidateContentActivity',
        validationInput
      );
      state.validationResult = validationResult.validationResult;

      if (validationResult.validationResult.isValid) {
        validationPassed = true;
      } else {
        // Step 5: Wait for human fix (Human-in-the-Loop)
        validationAttempts++;
        state.currentStep = WorkflowStep.AWAITING_HUMAN_FIX;
        state.lastUpdateTime = context.df.currentUtcDateTime.toISOString();
        context.df.setCustomStatus(state);
        
        // Create a timeout for the human fix
        const humanFixTimeout = context.df.createTimer(
          new Date(
            context.df.currentUtcDateTime.getTime() +
              config.workflow.humanFixTimeout * 1000
          )
        );
        
        // Wait for either the human fix event or timeout
        const humanFixEvent = context.df.waitForExternalEvent<HumanFixInput>(
          'HumanFixEvent'
        );
        
        const winner = yield context.df.Task.any([humanFixEvent, humanFixTimeout]);
        
        // Cancel the timer if human fixed before timeout
        if (!humanFixTimeout.isCompleted) {
          humanFixTimeout.cancel();
        }
        
        if (humanFixEvent.isCompleted) {
          const humanFix: HumanFixInput = humanFixEvent.result;
          state.extractedText = humanFix.correctedContent;
          context.log(`Human fix received: ${humanFix.notes || 'No notes'}`);
        } else {
          // Timeout occurred
          throw new Error(
            'Timeout waiting for human fix after validation failure'
          );
        }
      }
    }

    if (!validationPassed) {
      throw new Error(
        `Content validation failed after ${maxValidationAttempts} attempts`
      );
    }

    // Step 6: Generate draft using LLM
    state.currentStep = WorkflowStep.GENERATING_DRAFT;
    state.lastUpdateTime = context.df.currentUtcDateTime.toISOString();
    context.df.setCustomStatus(state);
    
    const draftInput: LlmGenerateDraftInput = {
      extractedText: state.extractedText!,
      searchResults: state.searchResults!,
    };
    
    const draftResult: LlmGenerateDraftOutput = yield context.df.callActivity(
      'LlmGenerateDraftActivity',
      draftInput
    );
    state.draft = draftResult.draft;

    // Step 7: Wait for draft approval (Human-in-the-Loop)
    let draftApproved = false;
    let approvalAttempts = 0;
    const maxApprovalAttempts = 3; // Prevent infinite loops
    
    while (!draftApproved && approvalAttempts < maxApprovalAttempts) {
      approvalAttempts++;
      state.currentStep = WorkflowStep.AWAITING_DRAFT_APPROVAL;
      state.lastUpdateTime = context.df.currentUtcDateTime.toISOString();
      context.df.setCustomStatus(state);
      
      // Create a timeout for the draft approval
      const approvalTimeout = context.df.createTimer(
        new Date(
          context.df.currentUtcDateTime.getTime() +
            config.workflow.draftApprovalTimeout * 1000
        )
      );
      
      // Wait for either the approval event or timeout
      const approvalEvent = context.df.waitForExternalEvent<DraftApprovalInput>(
        'DraftApprovalEvent'
      );
      
      const winner = yield context.df.Task.any([approvalEvent, approvalTimeout]);
      
      // Cancel the timer if approved before timeout
      if (!approvalTimeout.isCompleted) {
        approvalTimeout.cancel();
      }
      
      if (approvalEvent.isCompleted) {
        const approval: DraftApprovalInput = approvalEvent.result;
        
        if (approval.approved) {
          draftApproved = true;
          if (approval.modifications) {
            state.draft = approval.modifications;
          }
        } else {
          // Draft rejected, regenerate with feedback
          context.log(`Draft rejected: ${approval.comments || 'No comments'}`);
          
          // Regenerate draft (could incorporate feedback in a real implementation)
          const redraftInput: LlmGenerateDraftInput = {
            extractedText:
              state.extractedText! + `\n\nFeedback: ${approval.comments || ''}`,
            searchResults: state.searchResults!,
          };
          
          const redraftResult: LlmGenerateDraftOutput = yield context.df.callActivity(
            'LlmGenerateDraftActivity',
            redraftInput
          );
          state.draft = redraftResult.draft;
        }
      } else {
        // Timeout occurred
        throw new Error('Timeout waiting for draft approval');
      }
    }

    if (!draftApproved) {
      throw new Error(
        `Draft not approved after ${maxApprovalAttempts} attempts`
      );
    }

    // Step 8: Submit to internal system
    state.currentStep = WorkflowStep.SUBMITTING_TO_INTERNAL;
    state.lastUpdateTime = context.df.currentUtcDateTime.toISOString();
    context.df.setCustomStatus(state);
    
    const submitInput: CallMockInternalSubmitInput = {
      documentId: state.documentId,
      draft: state.draft!,
      requestorId: state.requestorId,
    };
    
    const submitResult: CallMockInternalSubmitOutput = yield context.df.callActivity(
      'CallMockInternalSubmitActivity',
      submitInput
    );
    state.submissionId = submitResult.submissionId;
    state.submissionStatus = submitResult.submissionStatus;

    // Step 9: Poll for submission status
    state.currentStep = WorkflowStep.POLLING_SUBMISSION_STATUS;
    state.lastUpdateTime = context.df.currentUtcDateTime.toISOString();
    context.df.setCustomStatus(state);
    
    let isComplete = false;
    let pollingAttempts = 0;
    
    while (!isComplete && pollingAttempts < config.workflow.pollingMaxAttempts) {
      pollingAttempts++;
      
      // Wait before polling
      const nextPollTime = new Date(
        context.df.currentUtcDateTime.getTime() +
          config.workflow.pollingInterval * 1000
      );
      yield context.df.createTimer(nextPollTime);
      
      // Check status
      const statusInput: CallMockInternalStatusInput = {
        submissionId: state.submissionId!,
      };
      
      const statusResult: CallMockInternalStatusOutput = yield context.df.callActivity(
        'CallMockInternalStatusActivity',
        statusInput
      );
      
      state.submissionStatus = statusResult.submissionStatus;
      state.lastUpdateTime = context.df.currentUtcDateTime.toISOString();
      context.df.setCustomStatus(state);
      
      isComplete = statusResult.isComplete;
    }

    if (!isComplete) {
      throw new Error(
        `Submission status polling timed out after ${pollingAttempts} attempts`
      );
    }

    // Workflow completed successfully
    state.currentStep = WorkflowStep.COMPLETED;
    state.lastUpdateTime = context.df.currentUtcDateTime.toISOString();
    context.df.setCustomStatus(state);

    const duration =
      context.df.currentUtcDateTime.getTime() -
      new Date(state.startTime).getTime();

    return {
      documentId: state.documentId,
      status: 'completed',
      draft: state.draft,
      submissionId: state.submissionId,
      submissionStatus: state.submissionStatus,
      errors: state.errors,
      totalDuration: duration,
    };
  } catch (error: any) {
    // Workflow failed
    state.currentStep = WorkflowStep.FAILED;
    state.errors.push(error.message || 'Unknown error');
    state.lastUpdateTime = context.df.currentUtcDateTime.toISOString();
    context.df.setCustomStatus(state);

    const duration =
      context.df.currentUtcDateTime.getTime() -
      new Date(state.startTime).getTime();

    return {
      documentId: state.documentId,
      status: 'failed',
      errors: state.errors,
      totalDuration: duration,
    };
  }
};

// Register the orchestrator
app.orchestration('RingiOrchestrator', ringiOrchestrator);
