document.getElementById('save').addEventListener('click', () => {
  const shortcuts = [];
  for (let i = 1; i <= 30; i++) {
    const shortcut = document.getElementById(`shortcut${i}`).value;
    const message = document.getElementById(`message${i}`).value;
    shortcuts.push({ shortcut, message });
  }
  chrome.storage.sync.set({ shortcuts }, () => {
    window.close();
  });
});

chrome.storage.sync.get(['shortcuts'], (data) => {
  if (data.shortcuts) {
    data.shortcuts.forEach(({ shortcut, message }, index) => {
      document.getElementById(`shortcut${index + 1}`).value = shortcut;
      document.getElementById(`message${index + 1}`).value = message;
    });
  }
});
