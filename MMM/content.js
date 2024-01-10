function simulateEnter(inputElement) {
  const event = new KeyboardEvent("keydown", {
    bubbles: true,
    cancelable: true,
    keyCode: 13,
  });
  setTimeout(() => {
    inputElement.dispatchEvent(event);
  }, 10);  // Delay of 1 second
}

// The rest of the code remains the same


function replaceShortcutWithValue(inputValue, shortcuts) {
  for (const { shortcut, message } of shortcuts) {
    if (inputValue === shortcut) {
      return message;
    }
  }
  return inputValue;
}

// Create a callback function to be run whenever the target node or its children are modified
const spanObserverCallback = (shortcuts) => (mutationsList, observer) => {
  for(let mutation of mutationsList) {
    if (mutation.type === 'characterData') {
      // console.log(`Span text changed to: ${mutation.target.data}`);
      const replacedValue = replaceShortcutWithValue(mutation.target.data, shortcuts);
      if (replacedValue !== mutation.target.data) {
        mutation.target.data = replacedValue;
        simulateEnter(mutation.target.parentNode);
      }
    }
  }
};

// Create a callback function to be run whenever mutations are observed in the body
const bodyObserverCallback = (shortcuts) => (mutationsList, observer) => {
  for(let mutation of mutationsList) {
    if (mutation.type === 'childList') {
      // Check if the added node is the span we're looking for
      const addedNode = Array.from(mutation.addedNodes).find(node => 
        node.classList && node.classList.contains('selectable-text') && node.classList.contains('copyable-text') && node.getAttribute('data-lexical-text') === 'true');
      if (addedNode) {
        // console.log(`Found span element`);

        // Create an observer instance linked to the callback function
        const spanObserver = new MutationObserver(spanObserverCallback(shortcuts));

        // Options for the observer (which mutations to observe)
        const config = { characterData: true, subtree: true };

        // Start observing the span node for configured mutations
        spanObserver.observe(addedNode, config);
      }
    }
  }
};

function init() {
  chrome.storage.sync.get(["shortcuts"], (data) => {
    if (data.shortcuts) {
      // Select the node to observe
      const bodyNode = document.querySelector('body');

      if (bodyNode) {
        // console.log(`Starting script`);

        // Options for the observer (which mutations to observe)
        const config = { childList: true, subtree: true };

        // Create an observer instance linked to the callback function
        const bodyObserver = new MutationObserver(bodyObserverCallback(data.shortcuts));

        // Start observing the body node for configured mutations
        bodyObserver.observe(bodyNode, config);
      } else {
        // console.log(`Body element not found`);
      }
    }
  });
}

init();
