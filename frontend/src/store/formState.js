/**
 * Form State Store Module
 * 
 * This module manages form state persistence across navigation in the application.
 * It allows saving and retrieving form values for different views.
 */

// State object to store form values for different views
const state = {
  home: {
    username: '',
    selectedScenario: ''
  },
  history: {
    username: '',
    selectedDockerId: ''
  },
  config: {
    username: '',
    scenarioId: '',
    settingsValues: {},
    globalSettings: {
      DefaultLLMModel: 'gemini',
      GeminiApiKey: '',
      DeepSeekApiKey: '',
      ClaudeApiKey: ''
    }
  }
};

/**
 * Save form state for a specific view
 * @param {string} view - The view name (home, history, config)
 * @param {Object} formData - The form data to save
 */
export function saveFormState(view, formData) {
  if (state[view]) {
    state[view] = { ...state[view], ...formData };
  }
}

/**
 * Get form state for a specific view
 * @param {string} view - The view name (home, history, config)
 * @returns {Object} The saved form state for the view
 */
export function getFormState(view) {
  return state[view] || {};
}

/**
 * Clear form state for a specific view
 * @param {string} view - The view name (home, history, config)
 */
export function clearFormState(view) {
  if (state[view]) {
    // Reset to initial empty state
    state[view] = {};
  }
}

/**
 * Clear all form states
 */
export function clearAllFormStates() {
  Object.keys(state).forEach(view => {
    state[view] = {};
  });
}

export default {
  state,
  saveFormState,
  getFormState,
  clearFormState,
  clearAllFormStates
};