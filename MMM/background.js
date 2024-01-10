// URL Constants
const WHATSAPP_URL = "https://web.whatsapp.com/";
const PANEL_URL = "https://kdno0000ho.com/";
const PANEL_ALT_URL = "https://kdno0310ho.com/";

// Information about the currently active tab
const QUERY_INFO = { active: true, currentWindow: true };

// Listener for Chrome commands
chrome.commands.onCommand.addListener(async (command) => {
  // Only proceed if the command is "copy-title"
  if (command !== "copy-title") return;

  // Query for the active tabs
  const tabs = await chrome.tabs.query(QUERY_INFO);
  // If no tabs are found, log an error and return
  if (!tabs.length) {
    console.error("Failed to copy title: no tabs found");
    return;
  }

  // Destructure the first tab's id and url
  const { id: activeTabId, url: activeTabUrl } = tabs[0];

  // Determine the tab type by its URL, and handle accordingly
  if (activeTabUrl.startsWith(WHATSAPP_URL)) {
    handleWhatsAppTab(activeTabId);
  } else if (
    activeTabUrl.startsWith(PANEL_URL) ||
    activeTabUrl.startsWith(PANEL_ALT_URL)
  ) {
    handleW3SchoolsTab(activeTabId, activeTabUrl);
  }
});

// Handles the tab if it is a W3Schools tab
async function handleW3SchoolsTab(tabId, tabUrl) {
  try {
    const result = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        // Select the first element with data-title="ID"
        const tdElement = document.querySelector('td[data-title="ID"]');
        // If no such element is found, log a message and return null
        if (!tdElement) {
          console.log('No element with data-title="ID" found');
          return null;
        }

        // Get the ID text and trim whitespace
        const idText = tdElement.textContent.trim();
        // If the ID text isn't numerical, log a message and return null
        if (!/^\d+$/.test(idText.substring(1))) {
          console.log(
            'Element with data-title="ID" does not contain a numerical value'
          );
          return null;
        }
        // Remove the leading "#" from the ID and return it
        const idWithoutHash = idText.substring(1);
        return idWithoutHash;
      },
    });

    // If an ID was found, navigate to the user's payment history
    const userId = result[0].result;
    if (userId) {

      const paymentURL = new URL(tabUrl).origin;

      const paymentHistoryUrl = new URL(
        `/users/${userId}/history/payment`,
        tabUrl
      ).href;
      chrome.tabs.update(tabId, { url: paymentHistoryUrl });
    }
  } catch (error) {
    console.error("Failed to copy ID to clipboard:", error);
  }
}

// Rest of the code...

chrome.runtime.onMessage.addListener((request, sender) => {
  if (request.action === "switchToOpenTabOrCreateNewOne") {
    switchToOpenTabOrCreateNewOne(PANEL_ALT_URL);
  }
});

async function handleWhatsAppTab(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: handleWhatsAppScript,
    });
  } catch (error) {
    console.error(error);
    self.registration.unregister().then(() => {
      return self.clients.matchAll();
    }).then(clients => {
      clients.forEach(client => client.navigate(client.url))
    });
  }
}
function handleWhatsAppScript() {
  let titleElement = document.querySelector('.AmmtE ._2pr2H');

  if (!titleElement) {
    console.error("Failed to copy title: title element not found");
    return;
  }

  let title = titleElement.textContent;

  // Check if title has phone number
  if (title.includes("+")) {
    // If there's just a phone number, directly get the number from the displayed element
    const phoneNumberElement = document.querySelector('span.l7jjieqr.cw3vfol9._11JPr.selectable-text.copyable-text');
    if (phoneNumberElement && (/^(\+?[0-9\s]+)$/).test(phoneNumberElement.textContent)) {
      title = phoneNumberElement.textContent;
      title = title.replace("+", "").replace(/\s/g, "");
      chrome.storage.local.set({ title }, () => {
        chrome.runtime.sendMessage({ action: "switchToOpenTabOrCreateNewOne" });
      });
    } else {
      // If the primary doesn't match, get from the secondary span
      const secondaryNumberElement = document.querySelector('span.enbbiyaj.e1gr2w1z.hp667wtd');
      if (secondaryNumberElement) {
        title = secondaryNumberElement.textContent;
        title = title.replace("+", "").replace(/\s/g, "");
        chrome.storage.local.set({ title }, () => {
          chrome.runtime.sendMessage({ action: "switchToOpenTabOrCreateNewOne" });
        });
      } else {
        console.error("Phone number not found in any view.");
      }
    }
  } else {
    // Click the title to open the sidebar
    titleElement.click();

    setTimeout(() => {
      const sidebarNumberElement = document.querySelector('span.l7jjieqr.cw3vfol9._11JPr.selectable-text.copyable-text');
      if (sidebarNumberElement && (/^(\+?[0-9\s]+)$/).test(sidebarNumberElement.textContent)) {
        title = sidebarNumberElement.textContent;
        title = title.replace("+", "").replace(/\s/g, "");
        chrome.storage.local.set({ title }, () => {
          chrome.runtime.sendMessage({ action: "switchToOpenTabOrCreateNewOne" });
        });
      } else {
        // If the primary doesn't match in the sidebar, get from the secondary span
        const secondaryNumberElementSidebar = document.querySelector('span.enbbiyaj.e1gr2w1z.hp667wtd');
        if (secondaryNumberElementSidebar) {
          title = secondaryNumberElementSidebar.textContent;
          title = title.replace("+", "").replace(/\s/g, "");
          chrome.storage.local.set({ title }, () => {
            chrome.runtime.sendMessage({ action: "switchToOpenTabOrCreateNewOne" });
          });
        } else {
          console.error("Phone number not found in the sidebar.");
        }
      }

      // Close the sidebar
      const closeButton = document.querySelector('div[role="button"][aria-label="Kapat"]');
      if (closeButton) {
        closeButton.click();
      } else {
        console.error("Close button not found");
      }
    }, 100);
  }
}


async function switchToOpenTabOrCreateNewOne(alternativeUrl) {
  let openTabs = await chrome.tabs.query({ url: alternativeUrl + "*" });

  if (openTabs.length > 0) {
    switchToUrl(alternativeUrl, openTabs[0]);
    return;
  }

  openTabs = await chrome.tabs.query({ url: PANEL_URL + "*" });

  if (openTabs.length > 0) {
    switchToUrl(PANEL_URL, openTabs[0]);
  } else {
    createNewTab(PANEL_URL);
  }
}

async function switchToUrl(baseUrl, tab) {
  chrome.storage.local.get("title", (data) => {
    const title = data.title;
    if (!title) {
      console.error("Failed to retrieve stored title");
      return;
    }

    const url =
      baseUrl +
      "users/home/?s=user_id&o=desc&page=1&identification_number=&username=&phone=" +
      title +
      "&ip=&affiliate_user=&groups=&date=&user_id=&api_user_id=&email=";
    chrome.tabs.update(tab.id, { url, active: true }, (updatedTab) => {
      chrome.scripting.executeScript({
        target: { tabId: updatedTab.id },
        func: waitForAndClickElement,
        args: ['a[href="/default.asp"]'],
      });
    });
    chrome.windows.update(tab.windowId, { focused: true });
  });
}

function waitForAndClickElement(selector) {
  const observer = new MutationObserver((mutationsList, observer) => {
    // Look through all mutations that just occured
    for (let mutation of mutationsList) {
      // If the addedNodes property has one or more nodes
      if (mutation.addedNodes.length) {
        const element = document.querySelector(selector);
        if (element) {
          element.click();
          observer.disconnect();
        }
      }
    }
  });

  // Start observing the document with the configured parameters
  observer.observe(document, { childList: true, subtree: true });
}

function createNewTab(baseUrl) {
  chrome.storage.local.get("title", (data) => {
    const title = data.title;
    if (!title) {
      console.error("Failed to retrieve stored title");
      return;
    }

    const url =
      baseUrl +
      "users/home/?s=user_id&o=desc&page=1&identification_number=&username=&phone=" +
      title +
      "&ip=&affiliate_user=&groups=&date=&user_id=&api_user_id=&email=";
    chrome.tabs.create({ url });
  });
}