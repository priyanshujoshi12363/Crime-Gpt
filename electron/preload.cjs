const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('crimeGPT', {
  checkSetup: () => ipcRenderer.invoke('auth:check-setup'),
  setupAdmin: (username, password) => ipcRenderer.invoke('auth:setup-admin', username, password),
  login: (username, password) => ipcRenderer.invoke('auth:login', username, password),
  createCase: (data) => ipcRenderer.invoke('case:create', data),
  getAllCases: () => ipcRenderer.invoke('case:get-all'),
  getCase: (id) => ipcRenderer.invoke('case:get', id),
  searchCases: (query) => ipcRenderer.invoke('case:search', query),
  updateCaseField: (id, field, value) => ipcRenderer.invoke('case:update-field', id, field, value),
  getStats: () => ipcRenderer.invoke('dashboard:stats'),
  addDiaryEntry: (data) => ipcRenderer.invoke('diary:add', data),
  getCaseDiary: (caseId) => ipcRenderer.invoke('diary:get', caseId)
});