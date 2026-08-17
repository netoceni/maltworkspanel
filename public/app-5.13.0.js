"use strict";

const API_BASE = ["localhost", "127.0.0.1"].includes(window.location.hostname)
  ? "http://127.0.0.1:8787"
  : "https://api.maltworks.com.br";
const REALTIME_BASE = API_BASE.replace(/^http/u, "ws");
const IS_PAGES_PREVIEW = window.location.hostname.endsWith(".pages.dev");
const ADMIN_URL = ["localhost", "127.0.0.1"].includes(window.location.hostname)
  ? "http://127.0.0.1:8791/"
  : "https://admin.maltworks.com.br";
const SVG_NS = "http://www.w3.org/2000/svg";
const temperatureChartInteractions = new WeakMap();

const state = {
  user: null,
  capabilities: { systemAdmin: false },
  devices: [],
  selectedDeviceId: null,
  latest: null,
  firmwareStatus: null,
  firmwareBusy: false,
  history: [],
  historyFrom: null,
  historyTo: null,
  recipes: [],
  batches: [],
  selectedBatchId: null,
  batchComparison: [],
  batchFormId: null,
  fermentation: null,
  fermentationError: null,
  fermentationBusy: false,
  showNewFermentationForm: false,
  historyRange: "600",
  chartPaused: false,
  chartPausedAt: null,
  chartRevision: 0,
  uiTimer: null,
  refreshTimer: null,
  historyTimer: null,
  supportingTimer: null,
  busy: false,
  historyBusy: false,
  supportingBusy: false,
  commandBusy: false,
  recipeBusy: false,
  profileCommandBusy: false,
  configurationBusy: false,
  configurationDirty: false,
  calibrationDirty: false,
  alarmsDirty: false,
  formDeviceId: null,
  pendingConfigurationCommandId: null,
  pendingConfigurationScope: null,
  activeTab: "dashboard",
  pendingClaim: null,
  openDeviceMenuId: null,
  editingDeviceId: null,
  deletingDeviceId: null,
  chartViewportStart: null,
  chartViewportEnd: null,
  notifications: [],
  notificationUnreadCount: 0,
  notificationPreferences: null,
  notificationsOpen: false,
  notificationsBusy: false,
  notificationTimer: null,
  presaleProduct: "Contato comercial",
  presaleCampaign: null,
  realtimeSocket: null,
  realtimeReconnectTimer: null,
  realtimeReconnectAttempt: 0,
  realtimeManualClose: false,
  realtimeLastMessageAt: 0,
  devicePresence: {},
};

const elements = {};

document.addEventListener("DOMContentLoaded", () => {
  // A navegação é inicializada primeiro e de forma independente. Assim, uma
  // falha posterior de API ou um HTML parcialmente atualizado não bloqueia as abas.
  initializeTabNavigation();
  cacheElements();
  bindEvents();
  initializePublicSite();
  restoreEmail();
  selectTab(readLocalPreference("mw_active_tab") || "dashboard");
  void restoreSession();
});

function cacheElements() {
  for (const id of [
    "loginView", "appView", "loginForm", "email", "password", "togglePassword",
    "previewEnvironmentNotice",
    "loginError", "loginButton", "logoutButton", "refreshButton", "globalStatus",
    "adminAccessLink", "notificationShell", "notificationButton", "notificationBadge",
    "notificationPanel", "closeNotificationButton", "notificationUnreadLabel",
    "markAllNotificationsReadButton", "clearAllNotificationsButton", "notificationList", "notificationEmpty",
    "notificationPreferencesForm", "notificationEmailEnabled", "notificationDeviceEvents",
    "notificationSensorEvents", "notificationAlarmEvents", "notificationProfileEvents",
    "notificationCommandEvents", "saveNotificationPreferencesButton",
    "signupForm", "signupName", "signupBirthDate", "signupPhone", "signupEmail",
    "signupPassword", "signupPasswordConfirm", "signupTerms", "signupError",
    "signupButton", "showSignupButton", "showLoginButton",
    "contactDialog", "closeContactButton", "contactForm",
    "contactName", "contactEmail", "contactPhone", "contactCity", "contactQuantity", "contactWebsite", "contactConsent",
    "contactError", "contactSubmitButton", "contactSuccess", "contactSuccessCloseButton",
    "claimLoginHint", "openClaimButton", "claimDialog", "closeClaimButton", "claimForm",
    "claimRegistrationToken", "claimDeviceName", "claimError",
    "claimSubmitButton", "claimSuccess", "claimSuccessCloseButton",
    "editDeviceDialog", "editDeviceForm", "closeEditDeviceButton",
    "cancelEditDeviceButton", "editDeviceName", "editDeviceFavorite",
    "editDeviceError", "saveEditDeviceButton",
    "deleteDeviceDialog", "deleteDeviceForm", "closeDeleteDeviceButton",
    "cancelDeleteDeviceButton", "deleteDeviceName", "deleteDeviceId",
    "deleteDeviceConfirmation", "deleteDeviceError", "deleteDeviceSubmitButton",
    "openDeleteDeviceButton", "deleteDeviceZone",
    "userName", "organizationName", "deviceCount", "deviceList", "deviceName",
    "emptyDeviceView", "emptyClaimButton",
    "deviceStatus", "deviceMeta", "lastUpdate", "refrigeratorTemperature",
    "setpointValue", "hysteresisValue", "thermalWellTemperature", "thermalWellStatus",
    "controlState", "coolingRelay", "heatingRelay", "rssiValue", "signalMeter",
    "signalQuality", "temperatureChart", "chartWrap", "chartGrid", "chartLabels", "targetPath",
    "temperaturePath", "chartEmpty", "profileBadge", "profileName", "profileStages",
    "profileRemaining", "compressorProtection", "alarmCard", "alarmBadge", "alarmSymbol",
    "alarmTitle", "alarmText", "firmwareBadge", "firmwareUpdateBadge", "firmwareUpdateStatus",
    "checkFirmwareButton", "systemDeviceId", "bootId", "uptime",
    "sequence", "remoteControlCard", "setpointForm", "remoteSetpoint",
    "setpointCommandButton", "commandBadge", "commandStatusText", "toast",
    "newRecipeButton", "recipeCount", "recipeList", "recipeEmpty", "recipeForm",
    "recipeId", "recipeName", "recipeDescription", "recipeFormTitle", "recipeStages",
    "addStageButton", "cancelRecipeButton", "saveRecipeButton", "profileCommandBadge",
    "profileCommandText", "pauseProfileButton", "resumeProfileButton", "stopProfileButton",
    "dashboardTabs", "configurationForm", "configurationHysteresis",
    "configurationCompressor", "saveConfigurationButton", "configurationBadge",
    "configurationStatusText", "calibrationForm", "calibrationBadge",
    "refrigeratorCalibrationStatus", "thermalWellCalibrationStatus",
    "refrigeratorRawReading", "refrigeratorCorrectedReading",
    "thermalWellRawReading", "thermalWellCorrectedReading",
    "refrigeratorOffsetInput", "thermalWellOffsetInput", "resetCalibrationButton",
    "saveCalibrationButton", "calibrationStatusText", "alarmSettingsBadge",
    "alarmDetailedSummary", "acknowledgeAlarmsButton", "alarmSettingsForm",
    "sensorAlarmEnabled", "highTemperatureEnabled", "lowTemperatureEnabled",
    "responseAlarmEnabled", "highTemperatureLimit", "lowTemperatureLimit",
    "minimumExpectedChange", "responseTimeoutMinutes", "saveAlarmSettingsButton",
    "alarmSettingsStatusText", "exportHistoryButton", "deviceRefrigeratorSensor",
    "deviceThermalWellSensor", "deviceCompressorDuration", "deviceSignal",
    "profileProgressText", "profileProgressFill", "openHistoryButton",
    "dashboardTemperatureChart", "dashboardChartWrap", "dashboardChartGrid", "dashboardChartLabels",
    "dashboardTargetPath", "dashboardTemperaturePath", "dashboardChartEmpty",
    "fermentationStartView", "fermentationStartForm", "fermentationNameInput",
    "fermentationOgInput", "fermentationStartedAtInput", "startFermentationButton",
    "fermentationStartStatus",
    "fermentationTrackingView", "fermentationName", "fermentationStartedAt",
    "fermentationStatusBadge", "newFermentationButton", "finishFermentationButton",
    "gravityOgValue", "gravityCurrentValue", "gravityReadingAge",
    "gravityAttenuationValue", "gravityAbvValue", "gravityChart", "gravityChartGrid",
    "gravityOgPath", "gravityPath", "gravityPoints", "gravityChartLabels",
    "gravityChartEmpty", "gravityReadingForm", "gravityReadingInput",
    "gravityMeasuredAtInput", "gravityNoteInput", "addGravityReadingButton",
    "gravityReadingCount", "gravityReadingsList", "gravityReadingsEmpty",
    "newBatchButton", "batchSelector", "batchCompareRecipe", "compareBatchesButton",
    "batchComparison", "batchComparisonCount", "batchComparisonBody",
    "batchCodeInput", "batchRecipeInput", "batchEquipmentInput",
    "batchPlannedFgInput", "batchPlannedVolumeInput",
    "batchDetailsForm", "batchNameField", "batchCodeField", "batchControllerField",
    "batchEquipmentField", "batchPlannedFgField", "batchFinalGravityField",
    "batchPlannedVolumeField", "batchActualVolumeField", "batchSummaryField",
    "batchSensoryScoreField", "batchSensoryNotesField", "saveBatchDetailsButton",
    "batchRecipeVersion", "batchRecipeSnapshot",
    "batchIngredientCount", "batchPlannedCost", "batchActualCost", "batchCostPerLiter",
    "batchIngredientForm", "ingredientNameInput", "ingredientCategoryInput",
    "ingredientUnitInput", "ingredientPlannedQuantityInput", "ingredientActualQuantityInput",
    "ingredientPlannedCostInput", "ingredientActualCostInput", "addBatchIngredientButton",
    "batchIngredientList", "batchIngredientEmpty",
    "batchJournalCount", "batchJournalForm", "batchJournalKindInput", "batchJournalDateInput",
    "batchJournalTitleInput", "batchJournalDetailsInput", "addBatchJournalButton",
    "batchJournalList", "batchJournalEmpty",
    "batchAttachmentCount", "batchAttachmentForm", "batchAttachmentInput",
    "uploadBatchAttachmentButton", "batchAttachmentList", "batchAttachmentEmpty",
  ]) {
    elements[id] = document.getElementById(id);
  }
}

function bindEvents() {
  elements.loginForm.addEventListener("submit", handleLogin);
  elements.signupForm.addEventListener("submit", handleSignup);
  elements.showSignupButton.addEventListener("click", showSignup);
  elements.showLoginButton.addEventListener("click", showLogin);
  elements.openContactButton?.addEventListener("click", openContactDialog);
  elements.closeContactButton.addEventListener("click", closeContactDialog);
  elements.contactSuccessCloseButton.addEventListener("click", closeContactDialog);
  elements.contactForm.addEventListener("submit", handleContactSubmit);
  elements.contactDialog.addEventListener("click", (event) => {
    if (event.target === elements.contactDialog) closeContactDialog();
  });
  elements.openClaimButton.addEventListener("click", () => openClaimDialog());
  elements.emptyClaimButton.addEventListener("click", () => openClaimDialog());
  elements.closeClaimButton.addEventListener("click", closeClaimDialog);
  elements.claimSuccessCloseButton.addEventListener("click", closeClaimDialog);
  elements.claimForm.addEventListener("submit", handleDeviceClaim);
  elements.claimDialog.addEventListener("click", (event) => {
    if (event.target === elements.claimDialog) closeClaimDialog();
  });
  elements.claimRegistrationToken.addEventListener("input", formatRegistrationTokenInput);
  elements.closeEditDeviceButton.addEventListener("click", closeEditDeviceDialog);
  elements.cancelEditDeviceButton.addEventListener("click", closeEditDeviceDialog);
  elements.editDeviceForm.addEventListener("submit", handleDeviceEdit);
  elements.editDeviceDialog.addEventListener("click", (event) => {
    if (event.target === elements.editDeviceDialog) closeEditDeviceDialog();
  });
  elements.openDeleteDeviceButton.addEventListener("click", () => openDeleteDeviceDialog());
  elements.closeDeleteDeviceButton.addEventListener("click", closeDeleteDeviceDialog);
  elements.cancelDeleteDeviceButton.addEventListener("click", closeDeleteDeviceDialog);
  elements.deleteDeviceForm.addEventListener("submit", handleDeviceDelete);
  elements.deleteDeviceDialog.addEventListener("click", (event) => {
    if (event.target === elements.deleteDeviceDialog) closeDeleteDeviceDialog();
  });
  elements.logoutButton.addEventListener("click", handleLogout);
  elements.refreshButton.addEventListener("click", () => void refreshAll(true));
  elements.checkFirmwareButton.addEventListener("click", () => void handleFirmwareCheck());
  elements.notificationButton.addEventListener("click", toggleNotificationPanel);
  elements.closeNotificationButton.addEventListener("click", closeNotificationPanel);
  elements.markAllNotificationsReadButton.addEventListener("click", () => void markAllNotificationsRead());
  elements.clearAllNotificationsButton.addEventListener("click", () => void clearAllNotifications());
  elements.notificationList.addEventListener("click", (event) => void handleNotificationClick(event));
  elements.notificationPreferencesForm.addEventListener("submit", handleNotificationPreferencesSave);
  elements.notificationEmailEnabled.addEventListener("change", renderNotificationPreferences);
  elements.adminAccessLink.href = ADMIN_URL;
  elements.togglePassword.addEventListener("click", togglePasswordVisibility);
  elements.setpointForm.addEventListener("submit", handleSetpointCommand);
  elements.newRecipeButton.addEventListener("click", () => openRecipeForm());
  elements.cancelRecipeButton.addEventListener("click", closeRecipeForm);
  elements.addStageButton.addEventListener("click", () => addStageRow());
  elements.recipeForm.addEventListener("submit", handleRecipeSave);
  elements.pauseProfileButton.addEventListener("click", () => void sendProfileCommand("pause"));
  elements.resumeProfileButton.addEventListener("click", () => void sendProfileCommand("resume"));
  elements.stopProfileButton.addEventListener("click", () => void sendProfileCommand("stop"));
  elements.configurationForm.addEventListener("submit", handleConfigurationSave);
  elements.calibrationForm.addEventListener("submit", handleCalibrationSave);
  elements.resetCalibrationButton.addEventListener("click", () => void resetCalibration());
  elements.alarmSettingsForm.addEventListener("submit", handleAlarmSettingsSave);
  elements.acknowledgeAlarmsButton.addEventListener("click", () => void acknowledgeAlarms());
  elements.exportHistoryButton.addEventListener("click", exportHistoryCsv);
  elements.openHistoryButton.addEventListener("click", () => selectTab("history"));
  elements.fermentationStartForm.addEventListener("submit", handleFermentationStart);
  elements.gravityReadingForm.addEventListener("submit", handleGravityReading);
  elements.finishFermentationButton.addEventListener("click", () => void finishFermentationTracking());
  elements.newFermentationButton.addEventListener("click", showNewFermentationForm);
  elements.newBatchButton.addEventListener("click", showNewFermentationForm);
  elements.batchSelector.addEventListener("change", () => void selectBatch(elements.batchSelector.value));
  elements.compareBatchesButton.addEventListener("click", () => void loadBatchComparison());
  elements.batchDetailsForm.addEventListener("submit", handleBatchDetailsSave);
  elements.batchIngredientForm.addEventListener("submit", handleBatchIngredientAdd);
  elements.batchJournalForm.addEventListener("submit", handleBatchJournalAdd);
  elements.batchAttachmentForm.addEventListener("submit", handleBatchAttachmentUpload);

  elements.configurationForm.addEventListener("input", () => { state.configurationDirty = true; });
  elements.calibrationForm.addEventListener("input", () => { state.calibrationDirty = true; });
  elements.alarmSettingsForm.addEventListener("input", () => { state.alarmsDirty = true; });

  document.querySelectorAll("[data-temperature-range]").forEach((button) => {
    button.addEventListener("click", () => {
      if (state.chartPaused) return;
      state.historyRange = button.dataset.temperatureRange;
      resetChartViewport();
      state.chartRevision += 1;
      document.querySelectorAll("[data-temperature-range]").forEach((item) => {
        item.classList.toggle("active", item.dataset.temperatureRange === state.historyRange);
      });
      scheduleHistoryRefresh();
      void loadHistory(true);
    });
  });
  document.querySelectorAll("[data-chart-pause]").forEach((button) => {
    button.addEventListener("click", toggleChartPause);
  });
  initializeTemperatureChartInteractions();
  updateChartLiveControls();

  document.addEventListener("click", (event) => {
    if (!event.target.closest?.(".device-menu-shell")) closeDeviceMenus();
    if (state.notificationsOpen && !elements.notificationShell.contains(event.target)) closeNotificationPanel();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.openDeviceMenuId) closeDeviceMenus();
    if (event.key === "Escape" && state.notificationsOpen) closeNotificationPanel();
  });

  window.addEventListener("focus", () => {
    if (!elements.appView.hidden) void refreshAll(false);
  });
}

function initializePublicSite() {
  if (IS_PAGES_PREVIEW) {
    elements.previewEnvironmentNotice.hidden = false;
    for (const form of [elements.loginForm, elements.signupForm]) {
      form.querySelectorAll("input, button").forEach((control) => { control.disabled = true; });
    }
  }

  document.querySelectorAll(".product-buy-button").forEach((button) => {
    button.addEventListener("click", () => {
      const product = button.dataset.product || "Maltworks Cloud";
      if (product.includes("Essencial")) {
        showSignup();
        document.getElementById("login")?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      const title = document.getElementById("contactTitle");
      const intro = elements.contactForm?.querySelector(".form-intro");
      if (title) title.textContent = "Reserve seu Maltworks";
      if (intro) intro.textContent = `${product}. Envie seus dados para receber o link de compra assim que a pré-venda abrir.`;
      state.presaleProduct = product;
      const params = new URLSearchParams(window.location.search);
      state.presaleCampaign = params.get("utm_campaign") || params.get("campaign") || null;
      openContactDialog();
    });
  });

  document.querySelectorAll('a[href="#login"]').forEach((link) => {
    link.addEventListener("click", () => {
      window.setTimeout(() => elements.email?.focus({ preventScroll: true }), 450);
    });
  });
}

function initializeTabNavigation() {
  const tablist = document.getElementById("dashboardTabs");
  if (!tablist) return;

  tablist.addEventListener("click", (event) => {
    const button = event.target.closest?.("[data-tab]");
    if (!button || !tablist.contains(button)) return;
    selectTab(button.dataset.tab);
  });

  tablist.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    const buttons = [...tablist.querySelectorAll("[data-tab]")];
    if (!buttons.length) return;
    const currentIndex = Math.max(0, buttons.indexOf(document.activeElement));
    const nextIndex = event.key === "Home"
      ? 0
      : event.key === "End"
        ? buttons.length - 1
        : (currentIndex + (event.key === "ArrowRight" ? 1 : -1) + buttons.length) % buttons.length;
    event.preventDefault();
    buttons[nextIndex].focus();
    selectTab(buttons[nextIndex].dataset.tab);
  });
}

function selectTab(requestedTab) {
  const available = [...document.querySelectorAll("#dashboardTabs [data-tab]")]
    .map((button) => button.dataset.tab);
  const tab = available.includes(requestedTab) ? requestedTab : "dashboard";
  state.activeTab = tab;
  writeLocalPreference("mw_active_tab", tab);

  document.querySelectorAll("#dashboardTabs [data-tab]").forEach((button) => {
    const active = button.dataset.tab === tab;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", active ? "true" : "false");
    button.tabIndex = active ? 0 : -1;
  });
  document.querySelectorAll("[data-tab-panel]").forEach((panel) => {
    panel.hidden = panel.dataset.tabPanel !== tab;
  });

  if (tab === "history" || tab === "dashboard") renderChart();
  if (tab === "gravity") renderFermentation();
}

async function restoreSession() {
  state.pendingClaim = readClaimFromUrl();
  renderClaimLoginHint();
  if (IS_PAGES_PREVIEW) {
    showLogin();
    return;
  }
  try {
    const response = await api("/v1/me");
    state.user = response.user;
    state.capabilities = response.capabilities || { systemAdmin: false };
    await enterDashboard();
  } catch (error) {
    showLogin();
    if (!isAuthenticationError(error)) {
      setLoginError("Não foi possível acessar a API Maltworks. Tente novamente em instantes.");
    }
  }
}

async function handleLogin(event) {
  event.preventDefault();
  setLoginError("");
  setLoginBusy(true);

  const email = elements.email.value.trim();
  const password = elements.password.value;

  try {
    await api("/v1/auth/login", {
      method: "POST",
      body: { email, password },
    });
    writeLocalPreference("mw_last_email", email);
    elements.password.value = "";
    const session = await api("/v1/me");
    state.user = session.user;
    state.capabilities = session.capabilities || { systemAdmin: false };
    await enterDashboard();
  } catch (error) {
    setLoginError(humanError(error, "Não foi possível entrar."));
  } finally {
    setLoginBusy(false);
  }
}

function openContactDialog() {
  elements.contactForm.hidden = false;
  elements.contactSuccess.hidden = true;
  setContactError("");
  setContactBusy(false);
  if (!elements.contactEmail.value) elements.contactEmail.value = elements.email.value.trim();
  elements.contactDialog.showModal();
  window.setTimeout(() => elements.contactName.focus(), 0);
}

function closeContactDialog() {
  if (elements.contactDialog.open) elements.contactDialog.close();
}

async function handleContactSubmit(event) {
  event.preventDefault();
  setContactError("");
  setContactBusy(true);

  try {
    await api("/v1/sales/leads", {
      method: "POST",
      body: {
        name: elements.contactName.value.trim(),
        email: elements.contactEmail.value.trim(),
        phone: elements.contactPhone.value.trim(),
        product: state.presaleProduct,
        city: elements.contactCity.value.trim(),
        quantity: Number(elements.contactQuantity.value),
        source: document.referrer ? "website-referral" : "website",
        campaign: state.presaleCampaign,
        consent: elements.contactConsent.checked,
        website: elements.contactWebsite.value,
      },
    });
    elements.contactForm.reset();
    elements.contactForm.hidden = true;
    elements.contactSuccess.hidden = false;
    elements.contactSuccessCloseButton.focus();
  } catch (error) {
    setContactError(humanError(error, "Não foi possível enviar seus dados. Tente novamente."));
  } finally {
    setContactBusy(false);
  }
}

async function handleLogout() {
  disconnectRealtime();
  try {
    await api("/v1/auth/logout", { method: "POST" });
  } catch {
    // A interface local deve encerrar a sessão mesmo se a rede cair.
  }
  clearTimers();
  state.user = null;
  state.capabilities = { systemAdmin: false };
  state.devices = [];
  state.recipes = [];
  state.batches = [];
  state.selectedBatchId = null;
  state.batchComparison = [];
  state.batchFormId = null;
  state.fermentation = null;
  state.fermentationError = null;
  state.latest = null;
  state.firmwareStatus = null;
  state.notifications = [];
  state.notificationUnreadCount = 0;
  state.notificationPreferences = null;
  closeNotificationPanel();
  showLogin();
  showToast("Sessão encerrada.");
}

async function enterDashboard() {
  elements.loginView.hidden = true;
  elements.appView.hidden = false;
  renderUser();
  await Promise.all([loadDevices(), loadRecipes(), loadNotifications(), loadNotificationPreferences()]);
  if (state.selectedDeviceId) {
    await Promise.all([loadLatest(), loadHistory(false), loadFermentation(), loadFirmwareStatus()]);
  }
  selectTab(state.activeTab);
  startTimers();
  connectRealtime();
  if (state.pendingClaim) openClaimDialog(state.pendingClaim);
}

function readClaimFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const registrationToken = formatRegistrationToken(
    params.get("registrationToken") || "",
  );
  if (!registrationToken) return null;
  return { registrationToken };
}

function renderClaimLoginHint() {
  elements.claimLoginHint.hidden = !state.pendingClaim;
}

function openClaimDialog(claim = null) {
  const source = claim || state.pendingClaim;
  elements.claimForm.hidden = false;
  elements.claimSuccess.hidden = true;
  setClaimError("");
  setClaimBusy(false);
  if (source) {
    elements.claimRegistrationToken.value = formatRegistrationToken(source.registrationToken || "");
  }
  if (!elements.claimDeviceName.value) elements.claimDeviceName.value = "Controlador Maltworks";
  if (!elements.claimDialog.open) elements.claimDialog.showModal();
  window.setTimeout(() => {
    const firstEmpty = [elements.claimRegistrationToken, elements.claimDeviceName]
      .find((field) => !field.value.trim());
    (firstEmpty || elements.claimDeviceName).focus();
    elements.claimDeviceName.select();
  }, 0);
}

function closeClaimDialog() {
  if (elements.claimDialog.open) elements.claimDialog.close();
}

async function handleDeviceClaim(event) {
  event.preventDefault();
  setClaimError("");
  setClaimBusy(true);

  const registrationToken = elements.claimRegistrationToken.value.trim().toUpperCase();
  const name = elements.claimDeviceName.value.trim();

  try {
    const response = await api("/v1/devices/claim", {
      method: "POST",
      body: { registrationToken, name },
    });
    state.pendingClaim = null;
    clearClaimFromUrl();
    renderClaimLoginHint();
    state.selectedDeviceId = response.device.id;
    writeLocalPreference("mw_selected_device", state.selectedDeviceId);
    await loadDevices();
    await Promise.all([loadLatest(), loadHistory(false), loadFermentation(), loadFirmwareStatus()]);
    elements.claimForm.hidden = true;
    elements.claimSuccess.hidden = false;
    elements.claimSuccessCloseButton.focus();
  } catch (error) {
    const fallback = error instanceof AppError && error.code === "REGISTRATION_TOKEN_NOT_FOUND"
      ? "Código ainda não encontrado. Confirme o Wi-Fi do controlador, aguarde alguns segundos e tente novamente."
      : "Não foi possível vincular o controlador.";
    setClaimError(humanError(error, fallback));
  } finally {
    setClaimBusy(false);
  }
}

function openEditDeviceDialog(deviceId) {
  const device = state.devices.find((item) => item.id === deviceId);
  if (!device) return;
  closeDeviceMenus();
  state.editingDeviceId = device.id;
  setEditDeviceError("");
  setEditDeviceBusy(false);
  elements.editDeviceName.value = device.name;
  elements.editDeviceFavorite.checked = device.favorite === true;
  if (!elements.editDeviceDialog.open) elements.editDeviceDialog.showModal();
  window.setTimeout(() => {
    elements.editDeviceName.focus();
    elements.editDeviceName.select();
  }, 0);
}

function closeEditDeviceDialog() {
  if (elements.editDeviceDialog.open) elements.editDeviceDialog.close();
  state.editingDeviceId = null;
}

async function handleDeviceEdit(event) {
  event.preventDefault();
  const deviceId = state.editingDeviceId;
  if (!deviceId) return;
  const name = elements.editDeviceName.value.trim();
  if (name.length < 2 || name.length > 80) {
    setEditDeviceError("O nome deve ter entre 2 e 80 caracteres.");
    elements.editDeviceName.focus();
    return;
  }

  setEditDeviceError("");
  setEditDeviceBusy(true);
  try {
    const response = await api(`/v1/devices/${encodeURIComponent(deviceId)}`, {
      method: "PUT",
      body: { name, favorite: elements.editDeviceFavorite.checked },
    });
    applyDeviceUpdate(response.device);
    closeEditDeviceDialog();
    showToast("Controlador atualizado.");
  } catch (error) {
    if (isAuthenticationError(error)) {
      closeEditDeviceDialog();
      showLogin();
      setLoginError("Sua sessão expirou. Entre novamente.");
      return;
    }
    setEditDeviceError(humanError(error, "Não foi possível atualizar o controlador."));
  } finally {
    setEditDeviceBusy(false);
  }
}

async function toggleDeviceFavorite(deviceId) {
  const device = state.devices.find((item) => item.id === deviceId);
  if (!device) return;
  closeDeviceMenus();
  try {
    const response = await api(`/v1/devices/${encodeURIComponent(deviceId)}`, {
      method: "PUT",
      body: { favorite: device.favorite !== true },
    });
    applyDeviceUpdate(response.device);
    showToast(response.device.favorite ? "Controlador adicionado aos favoritos." : "Controlador removido dos favoritos.");
  } catch (error) {
    if (isAuthenticationError(error)) {
      showLogin();
      setLoginError("Sua sessão expirou. Entre novamente.");
      return;
    }
    showToast(humanError(error, "Não foi possível alterar o favorito."));
  }
}

function applyDeviceUpdate(updatedDevice) {
  state.devices = state.devices
    .map((device) => device.id === updatedDevice.id ? { ...device, ...updatedDevice } : device)
    .sort((first, second) => Number(second.favorite === true) - Number(first.favorite === true) ||
      first.name.localeCompare(second.name, "pt-BR", { sensitivity: "base" }));
  renderDeviceList();
  renderLatest();
}

function closeDeviceMenus() {
  state.openDeviceMenuId = null;
  document.querySelectorAll(".device-menu").forEach((menu) => { menu.hidden = true; });
  document.querySelectorAll(".device-menu-button").forEach((button) => {
    button.setAttribute("aria-expanded", "false");
  });
}

function openDeleteDeviceDialog(deviceId = state.selectedDeviceId) {
  const device = state.devices.find((item) => item.id === deviceId);
  if (!device) {
    showToast("Selecione um controlador para excluir.");
    return;
  }
  closeDeviceMenus();
  state.deletingDeviceId = device.id;
  setDeleteDeviceError("");
  setDeleteDeviceBusy(false);
  elements.deleteDeviceName.textContent = device.name;
  elements.deleteDeviceId.textContent = device.id;
  elements.deleteDeviceConfirmation.value = "";
  if (!elements.deleteDeviceDialog.open) elements.deleteDeviceDialog.showModal();
  window.setTimeout(() => elements.deleteDeviceConfirmation.focus(), 0);
}

function closeDeleteDeviceDialog() {
  if (elements.deleteDeviceDialog.open) elements.deleteDeviceDialog.close();
  state.deletingDeviceId = null;
}

async function handleDeviceDelete(event) {
  event.preventDefault();
  const deviceId = state.deletingDeviceId;
  if (!deviceId) return;

  const confirmation = elements.deleteDeviceConfirmation.value.trim().toUpperCase();
  if (confirmation !== deviceId) {
    setDeleteDeviceError(`Digite ${deviceId} exatamente como mostrado.`);
    elements.deleteDeviceConfirmation.focus();
    return;
  }

  setDeleteDeviceError("");
  setDeleteDeviceBusy(true);
  try {
    await api(`/v1/devices/${encodeURIComponent(deviceId)}`, {
      method: "DELETE",
      body: { confirmDeviceId: confirmation },
    });
    closeDeleteDeviceDialog();
    if (state.selectedDeviceId === deviceId) {
      state.selectedDeviceId = null;
      state.latest = null;
      state.firmwareStatus = null;
      state.history = [];
      state.fermentation = null;
      removeLocalPreference("mw_selected_device");
    }
    await loadDevices();
    showToast("Controlador excluído. Ele já pode ser cadastrado novamente.");
  } catch (error) {
    if (isAuthenticationError(error)) {
      closeDeleteDeviceDialog();
      showLogin();
      setLoginError("Sua sessão expirou. Entre novamente.");
      return;
    }
    setDeleteDeviceError(humanError(error, "Não foi possível excluir o controlador."));
  } finally {
    setDeleteDeviceBusy(false);
  }
}

async function handleSignup(event) {
  event.preventDefault();
  setSignupError("");
  if (elements.signupPassword.value !== elements.signupPasswordConfirm.value) {
    setSignupError("As senhas informadas não são iguais.");
    elements.signupPasswordConfirm.focus();
    return;
  }

  setSignupBusy(true);
  const email = elements.signupEmail.value.trim();
  try {
    await api("/v1/auth/signup", {
      method: "POST",
      body: {
        displayName: elements.signupName.value.trim(),
        birthDate: elements.signupBirthDate.value,
        phone: elements.signupPhone.value.trim(),
        email,
        password: elements.signupPassword.value,
        termsAccepted: elements.signupTerms.checked,
      },
    });
    writeLocalPreference("mw_last_email", email);
    elements.signupPassword.value = "";
    elements.signupPasswordConfirm.value = "";
    const session = await api("/v1/me");
    state.user = session.user;
    state.capabilities = session.capabilities || { systemAdmin: false };
    await enterDashboard();
    showToast("Conta criada. Cadastre seu primeiro controlador.");
  } catch (error) {
    setSignupError(humanError(error, "Não foi possível criar sua conta."));
  } finally {
    setSignupBusy(false);
  }
}

function clearClaimFromUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete("claimDevice");
  url.searchParams.delete("pairingCode");
  url.searchParams.delete("registrationToken");
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

function showLogin() {
  disconnectRealtime();
  state.devicePresence = {};
  clearTimers();
  elements.appView.hidden = true;
  elements.loginView.hidden = false;
  elements.signupForm.hidden = true;
  elements.loginForm.hidden = false;
  if (window.location.hash === "#login" || state.pendingClaim) {
    window.setTimeout(() => elements.email.focus(), 0);
  }
}

function showSignup() {
  setLoginError("");
  setSignupError("");
  elements.loginForm.hidden = true;
  elements.signupForm.hidden = false;
  if (!elements.signupEmail.value) elements.signupEmail.value = elements.email.value.trim();
  document.getElementById("login")?.scrollIntoView({ behavior: "smooth", block: "start" });
  window.setTimeout(() => elements.signupName.focus(), 0);
}

async function loadDevices() {
  const response = await api("/v1/devices");
  state.devices = Array.isArray(response.devices) ? response.devices : [];

  const savedDevice = readLocalPreference("mw_selected_device");
  const previousDeviceId = state.selectedDeviceId;
  if (!state.selectedDeviceId || !state.devices.some((device) => device.id === state.selectedDeviceId)) {
    state.selectedDeviceId = state.devices.some((device) => device.id === savedDevice)
      ? savedDevice
      : state.devices[0]?.id ?? null;
  }
  if (previousDeviceId !== state.selectedDeviceId) resetChartViewport();

  renderDeviceList();
  if (!state.selectedDeviceId) {
    renderNoDevices();
  } else {
    document.querySelector("main.dashboard")?.classList.remove("no-devices");
    elements.emptyDeviceView.hidden = true;
  }
}

async function refreshAll(showConfirmation) {
  if (state.busy) return;
  state.busy = true;
  elements.refreshButton.classList.add("loading");

  try {
    await Promise.all([loadDevices(), loadRecipes(), loadNotifications()]);
    if (!state.selectedDeviceId) return;
    await Promise.all([loadLatest(), loadHistory(false), loadFermentation(), loadFirmwareStatus()]);
    if (showConfirmation) showToast("Dados atualizados.");
  } catch (error) {
    if (isAuthenticationError(error)) {
      showLogin();
      setLoginError("Sua sessão expirou. Entre novamente.");
    } else {
      setGlobalStatus("offline", "FALHA DE CONEXÃO");
      showToast(humanError(error, "Falha ao atualizar os dados."));
    }
  } finally {
    state.busy = false;
    elements.refreshButton.classList.remove("loading");
  }
}

async function refreshLatest() {
  if (state.busy || !state.selectedDeviceId || document.hidden) return;
  state.busy = true;

  try {
    await loadLatest();
  } catch (error) {
    handleRefreshError(error);
  } finally {
    state.busy = false;
  }
}

async function refreshSupportingData() {
  if (state.supportingBusy || !state.selectedDeviceId || document.hidden) return;
  state.supportingBusy = true;

  try {
    await loadDevices();
    await loadFermentation();
    await loadFirmwareStatus();
  } catch (error) {
    handleRefreshError(error);
  } finally {
    state.supportingBusy = false;
  }
}

async function refreshHistory() {
  if (state.chartPaused || state.historyBusy || !state.selectedDeviceId || document.hidden) return;
  state.historyBusy = true;

  try {
    await loadHistory(false);
  } catch (error) {
    handleRefreshError(error);
  } finally {
    state.historyBusy = false;
  }
}

function handleRefreshError(error) {
  if (isAuthenticationError(error)) {
    showLogin();
    setLoginError("Sua sessão expirou. Entre novamente.");
    return;
  }

  setGlobalStatus("offline", "FALHA DE CONEXÃO");
}

async function loadLatest() {
  if (!state.selectedDeviceId) return;
  const previousCommand = state.latest?.latestCommand;
  const response = await api(`/v1/devices/${encodeURIComponent(state.selectedDeviceId)}/latest`);
  state.latest = response;
  if (
    state.pendingConfigurationCommandId &&
    response.latestCommand?.id === state.pendingConfigurationCommandId &&
    ["applied", "rejected", "expired"].includes(response.latestCommand?.status)
  ) {
    if (response.latestCommand.status === "applied") {
      if (state.pendingConfigurationScope === "control") state.configurationDirty = false;
      if (state.pendingConfigurationScope === "calibration") state.calibrationDirty = false;
      if (state.pendingConfigurationScope === "alarms") state.alarmsDirty = false;
    }
    state.pendingConfigurationCommandId = null;
    state.pendingConfigurationScope = null;
  }
  renderLatest();
  announceCommandTransition(previousCommand, response.latestCommand);
}

async function loadFirmwareStatus() {
  if (!state.selectedDeviceId) return;
  const organizationId = state.user?.memberships?.[0]?.organizationId;
  const query = organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : "";
  const response = await api(
    `/v1/devices/${encodeURIComponent(state.selectedDeviceId)}/firmware${query}`,
  );
  state.firmwareStatus = response.firmware || null;
  renderFirmwareStatus();
}

async function handleFirmwareCheck() {
  if (!state.selectedDeviceId || state.firmwareBusy) return;
  state.firmwareBusy = true;
  renderFirmwareStatus();
  try {
    await loadFirmwareStatus();
    const firmware = state.firmwareStatus;
    const active = firmware?.assignment && ["assigned", "downloading", "installing", "rebooting", "validating"]
      .includes(firmware.assignment.status);
    if (active) {
      showToast(`Atualização para ${firmware.assignment.targetVersion} já está em andamento.`);
      return;
    }
    if (!firmware?.updateAvailable) {
      showToast("Este controlador já está na versão mais recente.");
      return;
    }
    const device = state.devices.find((item) => item.id === state.selectedDeviceId);
    const confirmed = window.confirm(
      `Atualizar ${device?.name || state.selectedDeviceId} de ${firmware.currentVersion} para ${firmware.latestVersion}?\n\n` +
      "O controlador buscará a atualização automaticamente, desligará os relés durante a instalação e reiniciará sozinho.",
    );
    if (!confirmed) return;
    const organizationId = state.user?.memberships?.[0]?.organizationId;
    const response = await api(
      `/v1/devices/${encodeURIComponent(state.selectedDeviceId)}/firmware/update`,
      { method: "POST", body: { organizationId } },
    );
    state.firmwareStatus.assignment = response.assignment;
    renderFirmwareStatus();
    showToast(response.alreadyScheduled
      ? "A atualização já estava agendada."
      : "Atualização solicitada. O controlador iniciará automaticamente.");
  } catch (error) {
    showToast(humanError(error, "Não foi possível solicitar a atualização."));
  } finally {
    state.firmwareBusy = false;
    renderFirmwareStatus();
  }
}

function renderFirmwareStatus() {
  const firmware = state.firmwareStatus;
  const assignment = firmware?.assignment;
  const viewer = state.user?.memberships?.[0]?.role === "viewer";
  const active = assignment && ["assigned", "downloading", "installing", "rebooting", "validating"]
    .includes(assignment.status);
  const statusLabels = {
    assigned: "AGENDADA",
    downloading: "BAIXANDO",
    installing: "INSTALANDO",
    rebooting: "REINICIANDO",
    validating: "VALIDANDO",
  };

  if (!firmware) {
    elements.firmwareUpdateBadge.textContent = "VERIFICANDO";
    elements.firmwareUpdateStatus.textContent = "Consultando a versão mais recente disponível…";
  } else if (active) {
    elements.firmwareUpdateBadge.textContent = statusLabels[assignment.status] || "EM ANDAMENTO";
    elements.firmwareUpdateStatus.textContent = `Atualização para ${assignment.targetVersion}: ${Number(assignment.progress || 0)}%.`;
  } else if (firmware.updateAvailable) {
    elements.firmwareUpdateBadge.textContent = "DISPONÍVEL";
    elements.firmwareUpdateStatus.textContent = `Versão instalada: ${firmware.currentVersion}. Nova versão: ${firmware.latestVersion}.`;
  } else {
    elements.firmwareUpdateBadge.textContent = "ATUALIZADO";
    elements.firmwareUpdateStatus.textContent = `Versão ${firmware.currentVersion || "—"} instalada. Nenhuma atualização pendente.`;
  }
  elements.checkFirmwareButton.disabled = !state.selectedDeviceId || state.firmwareBusy || viewer || Boolean(active);
  elements.checkFirmwareButton.textContent = state.firmwareBusy
    ? "VERIFICANDO…"
    : active ? "ATUALIZAÇÃO EM ANDAMENTO" : "BUSCAR FIRMWARE MAIS RECENTE";
}

async function loadHistory(showConfirmation) {
  if (state.chartPaused || !state.selectedDeviceId) return;
  const requestedRange = state.historyRange;
  const requestedRevision = state.chartRevision;
  const response = await api(
    `/v1/devices/${encodeURIComponent(state.selectedDeviceId)}/telemetry?range=${encodeURIComponent(requestedRange)}&maxPoints=720`,
  );
  if (
    state.chartPaused ||
    requestedRange !== state.historyRange ||
    requestedRevision !== state.chartRevision
  ) return;
  state.history = Array.isArray(response.points) ? response.points : [];
  state.historyFrom = response.from !== null && Number.isFinite(Number(response.from))
    ? Number(response.from)
    : null;
  state.historyTo = response.to !== null && Number.isFinite(Number(response.to))
    ? Number(response.to)
    : null;
  renderChart();
  if (showConfirmation) showToast("Período do gráfico atualizado.");
}

async function loadRecipes() {
  const response = await api("/v1/recipes");
  state.recipes = Array.isArray(response.recipes) ? response.recipes : [];
  renderRecipes();
  renderProfileProgress();
  renderBatchRecipeOptions();
}

async function loadFermentation() {
  if (!state.selectedDeviceId) {
    state.fermentation = null;
    state.fermentationError = null;
    renderFermentation();
    return;
  }
  try {
    await loadBatches();
    const selectedStillExists = state.batches.some((batch) => batch.id === state.selectedBatchId);
    if (!selectedStillExists) {
      state.selectedBatchId = state.batches.find(
        (batch) => batch.deviceId === state.selectedDeviceId && batch.active,
      )?.id || state.batches.find((batch) => batch.deviceId === state.selectedDeviceId)?.id || null;
    }
    if (!state.selectedBatchId) {
      state.fermentation = null;
      state.fermentationError = null;
      renderFermentation();
      return;
    }
    const response = await api(`/v1/batches/${encodeURIComponent(state.selectedBatchId)}`);
    state.fermentation = response.batch || null;
    state.fermentationError = null;
    renderFermentation();
  } catch (error) {
    if (isAuthenticationError(error)) throw error;
    state.fermentation = null;
    state.fermentationError = error;
    renderFermentation();
  }
}

async function loadBatches() {
  const response = await api("/v1/batches");
  state.batches = Array.isArray(response.batches) ? response.batches : [];
  renderBatchLibrary();
}

function renderBatchRecipeOptions() {
  const startValue = elements.batchRecipeInput.value;
  const compareValue = elements.batchCompareRecipe.value;
  const recipes = [...state.recipes].sort((a, b) => String(a.name).localeCompare(String(b.name), "pt-BR"));
  replaceSelectOptions(elements.batchRecipeInput, recipes, "Sem receita vinculada", startValue);
  replaceSelectOptions(elements.batchCompareRecipe, recipes, "Selecione uma receita", compareValue);
  elements.compareBatchesButton.disabled = !elements.batchCompareRecipe.value || state.fermentationBusy;
}

function replaceSelectOptions(select, items, emptyLabel, selectedValue) {
  const empty = document.createElement("option");
  empty.value = "";
  empty.textContent = emptyLabel;
  select.replaceChildren(empty);
  for (const item of items) {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = `${item.name} · v${item.version || 1}`;
    select.append(option);
  }
  select.value = items.some((item) => item.id === selectedValue) ? selectedValue : "";
}

function renderBatchLibrary() {
  if (!elements.batchSelector) return;
  const selected = state.selectedBatchId;
  const empty = document.createElement("option");
  empty.value = "";
  empty.textContent = state.batches.length ? "Selecione um lote" : "Nenhum lote cadastrado";
  elements.batchSelector.replaceChildren(empty);
  for (const batch of state.batches) {
    const option = document.createElement("option");
    option.value = batch.id;
    const status = batch.active ? "em andamento" : formatDateTime(batch.finishedAt || batch.startedAt);
    option.textContent = `${batch.batchCode ? `${batch.batchCode} · ` : ""}${batch.name} · ${batch.deviceName} · ${status}`;
    elements.batchSelector.append(option);
  }
  elements.batchSelector.value = state.batches.some((batch) => batch.id === selected) ? selected : "";
  const activeOnSelectedDevice = state.batches.some(
    (batch) => batch.deviceId === state.selectedDeviceId && batch.active,
  );
  elements.newBatchButton.disabled = !state.selectedDeviceId || activeOnSelectedDevice || state.fermentationBusy || state.user?.memberships?.[0]?.role === "viewer";
  renderBatchRecipeOptions();
}

async function selectBatch(batchId) {
  if (!batchId || state.fermentationBusy) return;
  const batch = state.batches.find((item) => item.id === batchId);
  if (!batch) return;
  if (batch.deviceId !== state.selectedDeviceId) {
    await selectDevice(batch.deviceId);
  }
  state.selectedBatchId = batchId;
  state.showNewFermentationForm = false;
  state.batchFormId = null;
  await loadFermentation();
}

async function loadBatchComparison() {
  const recipeId = elements.batchCompareRecipe.value;
  if (!recipeId || state.fermentationBusy) return;
  state.fermentationBusy = true;
  elements.compareBatchesButton.disabled = true;
  try {
    const response = await api(`/v1/batches/compare?recipeId=${encodeURIComponent(recipeId)}`);
    state.batchComparison = Array.isArray(response.batches) ? response.batches : [];
    renderBatchComparison();
    if (!state.batchComparison.length) showToast("Ainda não existem lotes desta receita para comparar.");
  } catch (error) {
    showToast(humanError(error, "Não foi possível comparar os lotes."));
  } finally {
    state.fermentationBusy = false;
    elements.compareBatchesButton.disabled = false;
  }
}

function renderBatchComparison() {
  elements.batchComparison.hidden = false;
  elements.batchComparisonCount.textContent = String(state.batchComparison.length);
  elements.batchComparisonBody.replaceChildren();
  for (const batch of state.batchComparison) {
    const row = document.createElement("tr");
    const metrics = batch.metrics || {};
    for (const value of [
      batch.batchCode || batch.name,
      `${formatGravity(batch.originalGravity)} / ${formatGravity(batch.finalGravity)}`,
      formatPercent(metrics.abv, 2),
      formatPercent(metrics.attenuation, 1),
      `${formatOptionalNumber(batch.plannedVolumeLiters, 1)} / ${formatOptionalNumber(batch.actualVolumeLiters, 1)} L`,
      `${formatCurrency(metrics.plannedCost)} / ${formatCurrency(metrics.actualCost)}`,
      batch.sensoryScore === null || batch.sensoryScore === undefined ? "—" : `${batch.sensoryScore}/100`,
    ]) {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.append(cell);
    }
    row.addEventListener("click", () => void selectBatch(batch.id));
    elements.batchComparisonBody.append(row);
  }
}

function renderBatchDetails(batch, viewer) {
  const disabled = viewer || state.fermentationBusy;
  if (state.batchFormId !== batch.id) {
    state.batchFormId = batch.id;
    elements.batchNameField.value = batch.name || "";
    elements.batchCodeField.value = batch.batchCode || "";
    elements.batchControllerField.value = batch.deviceName || batch.deviceId || "";
    elements.batchEquipmentField.value = batch.equipmentName || "";
    elements.batchPlannedFgField.value = inputNumber(batch.plannedFinalGravity, 3);
    elements.batchFinalGravityField.value = inputNumber(batch.finalGravity, 3);
    elements.batchPlannedVolumeField.value = inputNumber(batch.plannedVolumeLiters, 1);
    elements.batchActualVolumeField.value = inputNumber(batch.actualVolumeLiters, 1);
    elements.batchSummaryField.value = batch.summaryNotes || "";
    elements.batchSensoryScoreField.value = batch.sensoryScore ?? "";
    elements.batchSensoryNotesField.value = batch.sensoryNotes || "";
  }
  setFormDisabled(elements.batchDetailsForm, disabled);
  setFormDisabled(elements.batchIngredientForm, disabled);
  setFormDisabled(elements.batchJournalForm, disabled);
  setFormDisabled(elements.batchAttachmentForm, disabled);
  elements.saveBatchDetailsButton.textContent = state.fermentationBusy ? "SALVANDO…" : "SALVAR FICHA";
  setDefaultDateTime(elements.batchJournalDateInput);
  renderRecipeSnapshot(batch.recipeSnapshot);
  renderBatchIngredients(batch.ingredients || [], batch.metrics || {}, viewer);
  renderBatchJournal(batch.journal || [], viewer);
  renderBatchAttachments(batch.attachments || [], viewer);
}

function renderRecipeSnapshot(snapshot) {
  elements.batchRecipeSnapshot.replaceChildren();
  if (!snapshot) {
    elements.batchRecipeVersion.textContent = "SEM RECEITA";
    elements.batchRecipeSnapshot.hidden = true;
    return;
  }
  elements.batchRecipeSnapshot.hidden = false;
  elements.batchRecipeVersion.textContent = `RECEITA v${snapshot.version || 1}`;
  const title = document.createElement("strong");
  title.textContent = `Receita congelada: ${snapshot.name || "Sem nome"}`;
  const description = document.createElement("p");
  description.textContent = snapshot.description || "Sem descrição registrada.";
  const stages = document.createElement("ol");
  for (const stage of snapshot.stages || []) {
    const item = document.createElement("li");
    item.textContent = `${stage.name || "Etapa"} · ${formatNumber(stage.targetTemperature, 1)} °C · ${formatDuration(stage.durationSeconds)}`;
    stages.append(item);
  }
  elements.batchRecipeSnapshot.append(title, description, stages);
}

function renderBatchIngredients(items, metrics, viewer) {
  elements.batchIngredientCount.textContent = String(items.length);
  elements.batchPlannedCost.textContent = formatCurrency(metrics.plannedCost);
  elements.batchActualCost.textContent = formatCurrency(metrics.actualCost);
  elements.batchCostPerLiter.textContent = metrics.costPerLiter === null || metrics.costPerLiter === undefined
    ? "—" : `${formatCurrency(metrics.costPerLiter)}/L`;
  elements.batchIngredientList.replaceChildren();
  elements.batchIngredientEmpty.hidden = items.length > 0;
  for (const ingredient of items) {
    const item = batchListItem(
      ingredient.name,
      `${formatOptionalNumber(ingredient.plannedQuantity, 3)} ${ingredient.unit} planejado · ${formatOptionalNumber(ingredient.actualQuantity, 3)} ${ingredient.unit} real`,
      `${formatCurrency(ingredient.plannedCost)} → ${formatCurrency(ingredient.actualCost ?? ingredient.plannedCost)}`,
    );
    item.append(batchDeleteButton("Excluir ingrediente", viewer, () => deleteBatchIngredient(ingredient)));
    elements.batchIngredientList.append(item);
  }
}

function renderBatchJournal(items, viewer) {
  elements.batchJournalCount.textContent = String(items.length);
  elements.batchJournalList.replaceChildren();
  elements.batchJournalEmpty.hidden = items.length > 0;
  for (const entry of items) {
    const kind = entry.kind === "ocorrencia" ? "OCORRÊNCIA" : "OBSERVAÇÃO";
    const item = batchListItem(entry.title, `${kind} · ${formatDateTime(entry.occurredAt)}`, entry.details || "Sem detalhes");
    item.append(batchDeleteButton("Excluir registro", viewer, () => deleteBatchJournalEntry(entry)));
    elements.batchJournalList.append(item);
  }
}

function renderBatchAttachments(items, viewer) {
  elements.batchAttachmentCount.textContent = String(items.length);
  elements.batchAttachmentList.replaceChildren();
  elements.batchAttachmentEmpty.hidden = items.length > 0;
  for (const attachment of items) {
    const item = batchListItem(attachment.fileName, `${formatFileSize(attachment.sizeBytes)} · ${formatDateTime(attachment.createdAt)}`, attachment.contentType);
    const actions = document.createElement("div");
    actions.className = "batch-item-actions";
    const download = document.createElement("button");
    download.type = "button";
    download.className = "batch-item-download";
    download.textContent = "BAIXAR";
    download.addEventListener("click", () => void downloadBatchAttachment(attachment));
    actions.append(download, batchDeleteButton("Excluir anexo", viewer, () => deleteBatchAttachment(attachment)));
    item.append(actions);
    elements.batchAttachmentList.append(item);
  }
}

function batchListItem(titleText, metaText, detailText) {
  const item = document.createElement("article");
  item.className = "batch-item";
  const copy = document.createElement("div");
  copy.className = "batch-item-copy";
  const title = document.createElement("strong");
  title.textContent = titleText;
  const meta = document.createElement("span");
  meta.textContent = metaText;
  const detail = document.createElement("small");
  detail.textContent = detailText;
  copy.append(title, meta, detail);
  item.append(copy);
  return item;
}

function batchDeleteButton(label, viewer, action) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "batch-item-delete";
  button.textContent = "×";
  button.title = label;
  button.setAttribute("aria-label", label);
  button.disabled = viewer || state.fermentationBusy;
  button.addEventListener("click", () => void action());
  return button;
}

async function handleBatchDetailsSave(event) {
  event.preventDefault();
  if (state.fermentationBusy || !state.fermentation?.id || !elements.batchDetailsForm.reportValidity()) return;
  await mutateBatch(
    `/v1/batches/${encodeURIComponent(state.fermentation.id)}`,
    {
      method: "PUT",
      body: {
        name: elements.batchNameField.value.trim(),
        batchCode: elements.batchCodeField.value.trim(),
        equipmentName: elements.batchEquipmentField.value.trim(),
        plannedFinalGravity: optionalNumberInput(elements.batchPlannedFgField.value),
        finalGravity: optionalNumberInput(elements.batchFinalGravityField.value),
        plannedVolumeLiters: optionalNumberInput(elements.batchPlannedVolumeField.value),
        actualVolumeLiters: optionalNumberInput(elements.batchActualVolumeField.value),
        summaryNotes: elements.batchSummaryField.value.trim(),
        sensoryScore: optionalNumberInput(elements.batchSensoryScoreField.value),
        sensoryNotes: elements.batchSensoryNotesField.value.trim(),
      },
    },
    "Ficha do lote salva.",
  );
}

async function handleBatchIngredientAdd(event) {
  event.preventDefault();
  if (state.fermentationBusy || !state.fermentation?.id || !elements.batchIngredientForm.reportValidity()) return;
  const success = await mutateBatch(
    `/v1/batches/${encodeURIComponent(state.fermentation.id)}/ingredients`,
    {
      method: "POST",
      body: {
        name: elements.ingredientNameInput.value.trim(),
        category: elements.ingredientCategoryInput.value,
        unit: elements.ingredientUnitInput.value,
        plannedQuantity: optionalNumberInput(elements.ingredientPlannedQuantityInput.value),
        actualQuantity: optionalNumberInput(elements.ingredientActualQuantityInput.value),
        plannedCost: optionalNumberInput(elements.ingredientPlannedCostInput.value),
        actualCost: optionalNumberInput(elements.ingredientActualCostInput.value),
      },
    },
    "Ingrediente adicionado.",
  );
  if (success) elements.batchIngredientForm.reset();
}

async function handleBatchJournalAdd(event) {
  event.preventDefault();
  if (state.fermentationBusy || !state.fermentation?.id || !elements.batchJournalForm.reportValidity()) return;
  const success = await mutateBatch(
    `/v1/batches/${encodeURIComponent(state.fermentation.id)}/journal`,
    {
      method: "POST",
      body: {
        kind: elements.batchJournalKindInput.value,
        occurredAt: epochFromDateTimeInput(elements.batchJournalDateInput.value),
        title: elements.batchJournalTitleInput.value.trim(),
        details: elements.batchJournalDetailsInput.value.trim(),
      },
    },
    "Registro adicionado ao diário.",
  );
  if (success) {
    elements.batchJournalForm.reset();
    setDefaultDateTime(elements.batchJournalDateInput, null, true);
  }
}

async function handleBatchAttachmentUpload(event) {
  event.preventDefault();
  const file = elements.batchAttachmentInput.files?.[0];
  if (state.fermentationBusy || !state.fermentation?.id || !file) return;
  if (file.size > 10 * 1024 * 1024) {
    showToast("O anexo deve ter no máximo 10 MB.");
    return;
  }
  state.fermentationBusy = true;
  renderFermentation();
  try {
    const response = await apiFile(
      `/v1/batches/${encodeURIComponent(state.fermentation.id)}/attachments`,
      { method: "POST", body: file, headers: { "Content-Type": file.type, "X-File-Name": encodeURIComponent(file.name) } },
    );
    acceptBatchResponse(response);
    elements.batchAttachmentForm.reset();
    showToast("Anexo enviado.");
  } catch (error) {
    showToast(humanError(error, "Não foi possível enviar o anexo."));
  } finally {
    state.fermentationBusy = false;
    renderFermentation();
  }
}

async function deleteBatchIngredient(ingredient) {
  if (!window.confirm(`Excluir o ingrediente “${ingredient.name}”?`)) return;
  await mutateBatch(`/v1/batches/${encodeURIComponent(state.fermentation.id)}/ingredients/${encodeURIComponent(ingredient.id)}`, { method: "DELETE" }, "Ingrediente excluído.");
}

async function deleteBatchJournalEntry(entry) {
  if (!window.confirm(`Excluir o registro “${entry.title}”?`)) return;
  await mutateBatch(`/v1/batches/${encodeURIComponent(state.fermentation.id)}/journal/${encodeURIComponent(entry.id)}`, { method: "DELETE" }, "Registro excluído.");
}

async function deleteBatchAttachment(attachment) {
  if (!window.confirm(`Excluir o anexo “${attachment.fileName}”?`)) return;
  await mutateBatch(`/v1/batches/${encodeURIComponent(state.fermentation.id)}/attachments/${encodeURIComponent(attachment.id)}`, { method: "DELETE" }, "Anexo excluído.");
}

async function downloadBatchAttachment(attachment) {
  try {
    const response = await apiFile(`/v1/batches/${encodeURIComponent(state.fermentation.id)}/attachments/${encodeURIComponent(attachment.id)}`);
    const url = URL.createObjectURL(response);
    const link = document.createElement("a");
    link.href = url;
    link.download = attachment.fileName;
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    showToast(humanError(error, "Não foi possível baixar o anexo."));
  }
}

async function mutateBatch(path, options, successMessage) {
  state.fermentationBusy = true;
  renderFermentation();
  try {
    const response = await api(path, options);
    acceptBatchResponse(response);
    showToast(successMessage);
    return true;
  } catch (error) {
    showToast(humanError(error, "Não foi possível atualizar o lote."));
    return false;
  } finally {
    state.fermentationBusy = false;
    renderFermentation();
  }
}

function acceptBatchResponse(response) {
  if (!response?.batch) return;
  state.fermentation = response.batch;
  state.selectedBatchId = response.batch.id;
  state.batchFormId = null;
  const index = state.batches.findIndex((batch) => batch.id === response.batch.id);
  if (index >= 0) state.batches[index] = response.batch;
  else state.batches.unshift(response.batch);
  renderBatchLibrary();
}

function inputNumber(value, digits) {
  const number = Number(value);
  return value === null || value === undefined || !Number.isFinite(number) ? "" : number.toFixed(digits);
}

function formatOptionalNumber(value, digits) {
  const number = Number(value);
  return value === null || value === undefined || !Number.isFinite(number) ? "—" : formatNumber(number, digits);
}

function formatPercent(value, digits) {
  return value === null || value === undefined ? "—" : `${formatNumber(value, digits)}%`;
}

function formatCurrency(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—";
}

function formatFileSize(bytes) {
  const value = Number(bytes) || 0;
  if (value >= 1024 * 1024) return `${formatNumber(value / (1024 * 1024), 1)} MB`;
  if (value >= 1024) return `${formatNumber(value / 1024, 1)} kB`;
  return `${value} B`;
}

function renderUser() {
  elements.userName.textContent = state.user?.displayName || state.user?.email || "Usuário";
  elements.organizationName.textContent = state.user?.memberships?.[0]?.organizationName || "Maltworks";
  elements.adminAccessLink.hidden = state.capabilities.systemAdmin !== true;
  const role = state.user?.memberships?.[0]?.role;
  elements.deleteDeviceZone.hidden = !["owner", "admin"].includes(role);
}

async function loadNotifications() {
  const response = await api("/v1/notifications?limit=40");
  state.notifications = Array.isArray(response.notifications) ? response.notifications : [];
  state.notificationUnreadCount = Number(response.unreadCount) || 0;
  renderNotifications();
}

async function loadNotificationPreferences() {
  const response = await api("/v1/notifications/preferences");
  state.notificationPreferences = response.preferences || null;
  renderNotificationPreferences();
}

function toggleNotificationPanel() {
  if (state.notificationsOpen) {
    closeNotificationPanel();
    return;
  }
  state.notificationsOpen = true;
  elements.notificationPanel.hidden = false;
  elements.notificationButton.setAttribute("aria-expanded", "true");
  void loadNotifications().catch((error) => {
    showToast(humanError(error, "Não foi possível carregar as notificações."));
  });
}

function closeNotificationPanel() {
  state.notificationsOpen = false;
  if (elements.notificationPanel) elements.notificationPanel.hidden = true;
  if (elements.notificationButton) elements.notificationButton.setAttribute("aria-expanded", "false");
}

function renderNotifications() {
  const unread = Math.max(0, state.notificationUnreadCount);
  elements.notificationBadge.hidden = unread === 0;
  elements.notificationBadge.textContent = unread > 99 ? "99+" : String(unread);
  elements.notificationUnreadLabel.textContent = unread === 0
    ? "Nenhuma pendência"
    : `${unread} não lida${unread === 1 ? "" : "s"}`;
  elements.markAllNotificationsReadButton.disabled = unread === 0 || state.notificationsBusy;
  elements.clearAllNotificationsButton.disabled = state.notifications.length === 0 || state.notificationsBusy;
  elements.notificationList.replaceChildren();
  elements.notificationEmpty.hidden = state.notifications.length > 0;

  for (const notification of state.notifications) {
    const item = document.createElement("div");
    item.className = `notification-item${notification.isRead ? "" : " unread"}`;
    item.dataset.severity = notification.severity || "info";

    const openButton = document.createElement("button");
    openButton.type = "button";
    openButton.className = "notification-item-open";
    openButton.dataset.notificationId = notification.id;
    openButton.dataset.deviceId = notification.deviceId || "";

    const dot = document.createElement("span");
    dot.className = "notification-dot";
    dot.setAttribute("aria-hidden", "true");
    const copy = document.createElement("span");
    copy.className = "notification-copy";
    const title = document.createElement("b");
    title.textContent = notification.title || "Notificação Maltworks";
    const message = document.createElement("p");
    message.textContent = notification.message || "";
    const meta = document.createElement("span");
    meta.className = "notification-meta";
    const category = notificationCategoryLabel(notification.category);
    meta.textContent = `${category} · ${timeAgo(notification.createdAt)}`;
    copy.append(title, message, meta);
    openButton.append(dot, copy);
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "notification-delete-button";
    deleteButton.dataset.deleteNotificationId = notification.id;
    deleteButton.setAttribute("aria-label", `Apagar notificação: ${notification.title || "Maltworks"}`);
    deleteButton.title = "Apagar notificação";
    deleteButton.textContent = "×";
    deleteButton.disabled = state.notificationsBusy;
    item.append(openButton, deleteButton);
    elements.notificationList.append(item);
  }
}

async function handleNotificationClick(event) {
  const deleteButton = event.target.closest?.("[data-delete-notification-id]");
  if (deleteButton) {
    await deleteNotification(deleteButton.dataset.deleteNotificationId);
    return;
  }
  const item = event.target.closest?.("[data-notification-id]");
  if (!item || state.notificationsBusy) return;
  const notification = state.notifications.find((entry) => entry.id === item.dataset.notificationId);
  if (!notification) return;
  state.notificationsBusy = true;
  try {
    if (!notification.isRead) {
      const response = await api(`/v1/notifications/${encodeURIComponent(notification.id)}/read`, { method: "POST" });
      notification.isRead = true;
      state.notificationUnreadCount = Number(response.unreadCount) || 0;
    }
    if (notification.deviceId && state.devices.some((device) => device.id === notification.deviceId)) {
      await selectDevice(notification.deviceId);
    }
    if (notification.type === "firmware_available") selectTab("device");
    closeNotificationPanel();
  } catch (error) {
    showToast(humanError(error, "Não foi possível abrir a notificação."));
  } finally {
    state.notificationsBusy = false;
    renderNotifications();
  }
}

async function deleteNotification(notificationId) {
  if (state.notificationsBusy) return;
  const notification = state.notifications.find((entry) => entry.id === notificationId);
  if (!notification) return;
  if (!window.confirm(`Apagar a notificação “${notification.title || "Maltworks"}”?`)) return;
  state.notificationsBusy = true;
  renderNotifications();
  try {
    const response = await api(`/v1/notifications/${encodeURIComponent(notificationId)}`, { method: "DELETE" });
    state.notifications = state.notifications.filter((entry) => entry.id !== notificationId);
    state.notificationUnreadCount = Number(response.unreadCount) || 0;
    showToast("Notificação apagada.");
  } catch (error) {
    showToast(humanError(error, "Não foi possível apagar a notificação."));
  } finally {
    state.notificationsBusy = false;
    renderNotifications();
  }
}

async function clearAllNotifications() {
  if (state.notificationsBusy || state.notifications.length === 0) return;
  if (!window.confirm("Apagar todas as notificações da sua conta? Novos avisos continuarão aparecendo normalmente.")) return;
  state.notificationsBusy = true;
  renderNotifications();
  try {
    await api("/v1/notifications", { method: "DELETE" });
    state.notifications = [];
    state.notificationUnreadCount = 0;
    showToast("Todas as notificações foram apagadas.");
  } catch (error) {
    showToast(humanError(error, "Não foi possível apagar as notificações."));
  } finally {
    state.notificationsBusy = false;
    renderNotifications();
  }
}

async function markAllNotificationsRead() {
  if (state.notificationsBusy || state.notificationUnreadCount === 0) return;
  state.notificationsBusy = true;
  renderNotifications();
  try {
    await api("/v1/notifications/read-all", { method: "POST" });
    state.notifications.forEach((notification) => { notification.isRead = true; });
    state.notificationUnreadCount = 0;
    showToast("Todas as notificações foram marcadas como lidas.");
  } catch (error) {
    showToast(humanError(error, "Não foi possível atualizar as notificações."));
  } finally {
    state.notificationsBusy = false;
    renderNotifications();
  }
}

function renderNotificationPreferences() {
  const preferences = state.notificationPreferences || {
    emailEnabled: false,
    deviceEvents: true,
    sensorEvents: true,
    alarmEvents: true,
    profileEvents: true,
    commandEvents: true,
  };
  if (document.activeElement !== elements.notificationEmailEnabled) {
    elements.notificationEmailEnabled.checked = preferences.emailEnabled === true;
  }
  elements.notificationDeviceEvents.checked = preferences.deviceEvents !== false;
  elements.notificationSensorEvents.checked = preferences.sensorEvents !== false;
  elements.notificationAlarmEvents.checked = preferences.alarmEvents !== false;
  elements.notificationProfileEvents.checked = preferences.profileEvents !== false;
  elements.notificationCommandEvents.checked = preferences.commandEvents !== false;
  const disabled = !elements.notificationEmailEnabled.checked;
  for (const input of [
    elements.notificationDeviceEvents,
    elements.notificationSensorEvents,
    elements.notificationAlarmEvents,
    elements.notificationProfileEvents,
    elements.notificationCommandEvents,
  ]) input.disabled = disabled;
}

async function handleNotificationPreferencesSave(event) {
  event.preventDefault();
  if (state.notificationsBusy) return;
  state.notificationsBusy = true;
  elements.saveNotificationPreferencesButton.disabled = true;
  try {
    const response = await api("/v1/notifications/preferences", {
      method: "PUT",
      body: {
        emailEnabled: elements.notificationEmailEnabled.checked,
        deviceEvents: elements.notificationDeviceEvents.checked,
        sensorEvents: elements.notificationSensorEvents.checked,
        alarmEvents: elements.notificationAlarmEvents.checked,
        profileEvents: elements.notificationProfileEvents.checked,
        commandEvents: elements.notificationCommandEvents.checked,
      },
    });
    state.notificationPreferences = response.preferences;
    renderNotificationPreferences();
    showToast("Preferências de notificação salvas.");
  } catch (error) {
    showToast(humanError(error, "Não foi possível salvar as preferências."));
  } finally {
    state.notificationsBusy = false;
    elements.saveNotificationPreferencesButton.disabled = false;
  }
}

function notificationCategoryLabel(category) {
  return ({
    device: "CONTROLADOR",
    sensor: "SENSOR",
    alarm: "ALARME",
    profile: "RECEITA",
    command: "COMANDO",
  })[category] || "SISTEMA";
}

function renderDeviceList() {
  elements.deviceCount.textContent = String(state.devices.length);
  elements.deviceList.replaceChildren();

  for (const device of state.devices) {
    const connection = connectionStatus(device.stateReceivedAt || device.lastSeenAt, device.id);
    const item = document.createElement("div");
    item.className = `device-item${device.id === state.selectedDeviceId ? " active" : ""}`;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "device-select";
    button.setAttribute("aria-current", device.id === state.selectedDeviceId ? "true" : "false");

    const symbol = document.createElement("span");
    symbol.className = "device-symbol";
    symbol.textContent = "°";

    const copy = document.createElement("span");
    const name = document.createElement("b");
    name.textContent = device.name;
    if (device.favorite === true) {
      const favorite = document.createElement("i");
      favorite.className = "device-favorite-mark";
      favorite.setAttribute("aria-label", "Favorito");
      favorite.textContent = "★";
      name.append(" ", favorite);
    }
    const status = document.createElement("small");
    status.textContent = connection === "online"
      ? "Online agora"
      : connection === "unstable" ? "Conexão instável" : "Sem comunicação";
    copy.append(name, status);

    const dot = document.createElement("i");
    dot.className = `device-dot ${connection}`;

    button.append(symbol, copy, dot);
    button.addEventListener("click", () => void selectDevice(device.id));

    const menuShell = document.createElement("div");
    menuShell.className = "device-menu-shell";
    const menuButton = document.createElement("button");
    menuButton.type = "button";
    menuButton.className = "device-menu-button";
    menuButton.setAttribute("aria-label", `Ações de ${device.name}`);
    menuButton.setAttribute("aria-haspopup", "menu");
    menuButton.setAttribute("aria-expanded", state.openDeviceMenuId === device.id ? "true" : "false");
    menuButton.textContent = "⋮";

    const menu = document.createElement("div");
    menu.className = "device-menu";
    menu.setAttribute("role", "menu");
    menu.hidden = state.openDeviceMenuId !== device.id;
    const menuActions = [
      createDeviceMenuAction("Editar nome", () => openEditDeviceDialog(device.id)),
      createDeviceMenuAction(
        device.favorite === true ? "Remover favorito" : "Adicionar favorito",
        () => void toggleDeviceFavorite(device.id),
      ),
    ];
    const role = state.user?.memberships?.[0]?.role;
    if (["owner", "admin"].includes(role)) {
      menuActions.push(
        createDeviceMenuAction("Excluir controlador", () => openDeleteDeviceDialog(device.id), true),
      );
    }
    menu.append(...menuActions);

    menuButton.addEventListener("click", (event) => {
      event.stopPropagation();
      const opening = state.openDeviceMenuId !== device.id;
      closeDeviceMenus();
      if (opening) {
        state.openDeviceMenuId = device.id;
        menu.hidden = false;
        menuButton.setAttribute("aria-expanded", "true");
      }
    });

    menuShell.append(menuButton, menu);
    item.append(button, menuShell);
    elements.deviceList.append(item);
  }
}

function createDeviceMenuAction(label, action, danger = false) {
  const button = document.createElement("button");
  button.type = "button";
  button.setAttribute("role", "menuitem");
  if (danger) button.className = "danger";
  button.textContent = label;
  button.addEventListener("click", action);
  return button;
}

async function selectDevice(deviceId) {
  if (deviceId === state.selectedDeviceId) return;
  state.selectedDeviceId = deviceId;
  closeDeviceMenus();
  writeLocalPreference("mw_selected_device", deviceId);
  renderDeviceList();
  state.latest = null;
  state.firmwareStatus = null;
  state.history = [];
  resetChartViewport();
  state.fermentation = null;
  state.fermentationError = null;
  state.selectedBatchId = null;
  state.batchFormId = null;
  state.showNewFermentationForm = false;
  state.formDeviceId = null;
  state.configurationDirty = false;
  state.calibrationDirty = false;
  state.alarmsDirty = false;
  state.pendingConfigurationCommandId = null;
  state.pendingConfigurationScope = null;
  renderLoadingDevice();
  renderFirmwareStatus();
  await refreshAll(false);
}

function renderLatest() {
  const snapshot = state.latest;
  const data = snapshot?.state;
  if (!data) return;

  const device = state.devices.find((item) => item.id === state.selectedDeviceId);
  const connection = connectionStatus(snapshot.receivedAt);

  elements.deviceName.textContent = device?.name || data.deviceId;
  renderConnectionStatus(connection);
  elements.deviceMeta.textContent = `${data.deviceId}  ·  FIRMWARE ${data.firmware?.version || "—"}`;
  elements.lastUpdate.textContent = `${formatDateTime(snapshot.receivedAt)} · ${timeAgo(snapshot.receivedAt)}`;

  const refrigerator = data.temperatures?.refrigerator;
  const thermalWell = data.temperatures?.thermalWell;
  elements.refrigeratorTemperature.textContent = formatNumber(refrigerator?.value, 2);
  elements.setpointValue.textContent = `${formatNumber(data.control?.setpoint, 1)} °C`;
  elements.hysteresisValue.textContent = `${formatNumber(data.control?.hysteresis, 1)} °C`;

  elements.thermalWellTemperature.textContent = thermalWell?.connected
    ? formatNumber(thermalWell.value, 2)
    : "—";
  elements.thermalWellStatus.textContent = thermalWell?.connected
    ? `Sensor conectado · offset ${formatNumber(thermalWell.offset, 2)} °C`
    : "Sensor desconectado";

  elements.controlState.textContent = data.control?.state || "—";
  elements.coolingRelay.classList.toggle("active-cooling", Boolean(data.control?.cooling));
  elements.heatingRelay.classList.toggle("active-heating", Boolean(data.control?.heating));
  elements.coolingRelay.textContent = `RESFRIAMENTO ${data.control?.cooling ? "ON" : "OFF"}`;
  elements.heatingRelay.textContent = `AQUECIMENTO ${data.control?.heating ? "ON" : "OFF"}`;

  const rssi = Number(data.network?.rssi);
  const signal = signalDetails(rssi);
  elements.rssiValue.textContent = Number.isFinite(rssi) ? String(rssi) : "—";
  elements.signalMeter.style.width = `${signal.percent}%`;
  elements.signalMeter.style.background = signal.color;
  elements.signalQuality.textContent = signal.label;

  const profile = data.profile || {};
  elements.profileBadge.textContent = profile.state || "—";
  elements.profileName.textContent = profile.name || "Nenhuma receita";
  elements.profileStages.textContent = profile.stageCount
    ? `${Number(profile.stage || 0) + 1} de ${profile.stageCount}`
    : "—";
  elements.profileRemaining.textContent = formatDuration(profile.remainingSeconds);
  elements.compressorProtection.textContent = data.control?.compressorProtectionSeconds
    ? `${data.control.compressorProtectionSeconds} s`
    : "Liberado";
  renderProfileProgress();

  renderAlarms(data.alarms);

  elements.firmwareBadge.textContent = `v${data.firmware?.version || "—"}`;
  elements.systemDeviceId.textContent = data.deviceId || "—";
  elements.bootId.textContent = data.bootId || "—";
  elements.uptime.textContent = formatDuration(data.uptimeSeconds);
  elements.sequence.textContent = Number(data.sequence || 0).toLocaleString("pt-BR");
  renderRemoteControl();
  renderProfileControls();
  renderRecipes();
  renderConfigurationForms();
  renderCalibration();
  renderAlarmSettings();
  renderDeviceDetails();
}

function renderProfileProgress() {
  const profile = state.latest?.state?.profile || {};
  const active = Boolean(profile.active);
  const completed = String(profile.state || "").toUpperCase().includes("CONCLU");
  let percent = 0;
  let label = "—";

  if (active || completed) {
    const recipe = state.recipes.find((item) => item.name === profile.name);
    const totalSeconds = (recipe?.stages || [])
      .reduce((total, stage) => total + Number(stage.durationSeconds || 0), 0);
    const remainingSeconds = Number(profile.remainingSeconds);
    if (completed) {
      percent = 100;
    } else if (totalSeconds > 0 && Number.isFinite(remainingSeconds)) {
      percent = Math.max(0, Math.min(100, ((totalSeconds - remainingSeconds) / totalSeconds) * 100));
    } else if (Number(profile.stageCount) > 0) {
      percent = Math.max(0, Math.min(100, (Number(profile.stage || 0) / Number(profile.stageCount)) * 100));
    }
    const stageText = Number(profile.stageCount) > 0
      ? ` · etapa ${Number(profile.stage || 0) + 1}/${Number(profile.stageCount)}`
      : "";
    label = `${Math.round(percent)}%${stageText}`;
  }

  elements.profileProgressText.textContent = label;
  elements.profileProgressFill.style.width = `${percent.toFixed(1)}%`;
  const progressbar = elements.profileProgressFill.parentElement;
  progressbar?.setAttribute("aria-valuenow", String(Math.round(percent)));
}

function renderFermentation() {
  const fermentation = state.fermentation;
  const viewer = state.user?.memberships?.[0]?.role === "viewer";
  renderBatchLibrary();
  const showStart = !fermentation || state.showNewFermentationForm;
  elements.fermentationStartView.hidden = !showStart;
  elements.fermentationTrackingView.hidden = showStart;

  if (showStart) {
    renderBatchRecipeOptions();
    setDefaultDateTime(elements.fermentationStartedAtInput);
    setFormDisabled(
      elements.fermentationStartForm,
      !state.selectedDeviceId || viewer || state.fermentationBusy || Boolean(state.fermentationError),
    );
    elements.startFermentationButton.textContent = state.fermentationBusy
      ? "SALVANDO…"
      : "INICIAR ACOMPANHAMENTO";
    elements.fermentationStartStatus.textContent = state.fermentationError
      ? "Acompanhamento indisponível. Atualize primeiro a API para a versão 5.4.0 e aplique a migração 0005."
      : "As leituras ficam salvas na nuvem e acompanham o controlador selecionado.";
    return;
  }

  const active = fermentation.active === true;
  const readings = Array.isArray(fermentation.readings) ? fermentation.readings : [];
  const lastReading = readings.at(-1) || null;
  const originalGravity = Number(fermentation.originalGravity);
  const currentGravity = Number(lastReading?.gravity);
  const attenuation = fermentation.metrics?.attenuation ?? (Number.isFinite(currentGravity) && originalGravity > 1
    ? Math.max(0, ((originalGravity - currentGravity) / (originalGravity - 1)) * 100)
    : null);
  const estimatedAbv = fermentation.metrics?.abv ?? (Number.isFinite(currentGravity)
    ? Math.max(0, (originalGravity - currentGravity) * 131.25)
    : null);

  elements.fermentationName.textContent = fermentation.name || "Fermentação";
  elements.fermentationStartedAt.textContent = active
    ? `Iniciada em ${formatDateTime(fermentation.startedAt)}`
    : `Iniciada em ${formatDateTime(fermentation.startedAt)} · encerrada em ${formatDateTime(fermentation.finishedAt)}`;
  setOutlineBadge(
    elements.fermentationStatusBadge,
    active ? "applied" : "neutral",
    active ? "EM ANDAMENTO" : "ENCERRADO",
  );
  elements.finishFermentationButton.hidden = !active;
  elements.finishFermentationButton.disabled = viewer || state.fermentationBusy;
  elements.newFermentationButton.hidden = active;
  elements.newFermentationButton.disabled = viewer || state.fermentationBusy || state.batches.some(
    (batch) => batch.deviceId === state.selectedDeviceId && batch.active,
  );
  elements.gravityReadingForm.hidden = !active;
  setFormDisabled(elements.gravityReadingForm, viewer || state.fermentationBusy || !active);
  elements.addGravityReadingButton.textContent = state.fermentationBusy ? "SALVANDO…" : "ADICIONAR LEITURA";
  setDefaultDateTime(elements.gravityMeasuredAtInput);

  elements.gravityOgValue.textContent = formatGravity(originalGravity);
  elements.gravityCurrentValue.textContent = lastReading ? formatGravity(currentGravity) : "—";
  elements.gravityReadingAge.textContent = lastReading ? timeAgo(lastReading.measuredAt) : "Sem medições";
  elements.gravityAttenuationValue.textContent = attenuation === null ? "—" : `${attenuation.toFixed(1).replace(".", ",")}%`;
  elements.gravityAbvValue.textContent = estimatedAbv === null ? "—" : `${estimatedAbv.toFixed(2).replace(".", ",")}%`;
  elements.gravityReadingCount.textContent = String(readings.length);
  renderGravityReadings(readings, viewer);
  renderGravityChart(fermentation);
  renderBatchDetails(fermentation, viewer);
}

function renderGravityReadings(readings, viewer) {
  elements.gravityReadingsList.replaceChildren();
  elements.gravityReadingsEmpty.hidden = readings.length > 0;
  for (const reading of [...readings].reverse()) {
    const item = document.createElement("article");
    item.className = "gravity-reading-item";
    const gravity = document.createElement("b");
    gravity.textContent = formatGravity(reading.gravity);
    const copy = document.createElement("div");
    copy.className = "gravity-reading-copy";
    const measuredAt = document.createElement("span");
    measuredAt.textContent = formatDateTime(reading.measuredAt);
    const note = document.createElement("small");
    note.textContent = reading.note || "Sem observação";
    copy.append(measuredAt, note);
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "gravity-reading-delete";
    remove.textContent = "×";
    remove.setAttribute("aria-label", `Excluir leitura ${formatGravity(reading.gravity)}`);
    remove.disabled = viewer || state.fermentationBusy;
    remove.addEventListener("click", () => void deleteGravityReading(reading));
    item.append(gravity, copy, remove);
    elements.gravityReadingsList.append(item);
  }
}

async function handleFermentationStart(event) {
  event.preventDefault();
  if (state.fermentationBusy || !state.selectedDeviceId) return;
  if (!elements.fermentationStartForm.reportValidity()) return;
  const name = elements.fermentationNameInput.value.trim();
  const originalGravity = parseGravityInput(elements.fermentationOgInput.value);
  const startedAt = epochFromDateTimeInput(elements.fermentationStartedAtInput.value);
  const plannedFinalGravity = optionalNumberInput(elements.batchPlannedFgInput.value);
  const plannedVolumeLiters = optionalNumberInput(elements.batchPlannedVolumeInput.value);
  if (!validGravity(originalGravity)) {
    showToast("Informe uma OG entre 0.990 e 1.200, com três casas decimais.");
    return;
  }
  if (!startedAt) {
    showToast("Informe a data e a hora de início da fermentação.");
    return;
  }

  state.fermentationBusy = true;
  renderFermentation();
  try {
    const response = await api(
      `/v1/devices/${encodeURIComponent(state.selectedDeviceId)}/fermentation`,
      {
        method: "POST",
        body: {
          name,
          originalGravity,
          startedAt,
          batchCode: elements.batchCodeInput.value.trim(),
          recipeId: elements.batchRecipeInput.value || null,
          equipmentName: elements.batchEquipmentInput.value.trim(),
          plannedFinalGravity,
          plannedVolumeLiters,
        },
      },
    );
    state.selectedBatchId = response.fermentation?.id || null;
    state.fermentationError = null;
    state.showNewFermentationForm = false;
    state.batchFormId = null;
    elements.fermentationStartForm.reset();
    setDefaultDateTime(elements.fermentationStartedAtInput, null, true);
    await loadFermentation();
    showToast("Acompanhamento da fermentação iniciado.");
  } catch (error) {
    showToast(humanError(error, "Não foi possível iniciar o acompanhamento."));
  } finally {
    state.fermentationBusy = false;
    renderFermentation();
  }
}

async function handleGravityReading(event) {
  event.preventDefault();
  if (state.fermentationBusy || !state.selectedDeviceId || !state.fermentation?.active) return;
  if (!elements.gravityReadingForm.reportValidity()) return;
  const gravity = parseGravityInput(elements.gravityReadingInput.value);
  const measuredAt = epochFromDateTimeInput(elements.gravityMeasuredAtInput.value);
  if (!validGravity(gravity)) {
    showToast("Informe uma densidade entre 0.990 e 1.200, com três casas decimais.");
    return;
  }
  if (!measuredAt) {
    showToast("Informe a data e a hora da medição.");
    return;
  }

  state.fermentationBusy = true;
  renderFermentation();
  try {
    await api(
      `/v1/devices/${encodeURIComponent(state.selectedDeviceId)}/fermentation/readings`,
      {
        method: "POST",
        body: { gravity, measuredAt, note: elements.gravityNoteInput.value.trim() },
      },
    );
    state.fermentationError = null;
    elements.gravityReadingInput.value = "";
    elements.gravityNoteInput.value = "";
    setDefaultDateTime(elements.gravityMeasuredAtInput, null, true);
    await loadFermentation();
    showToast("Leitura adicionada à curva de densidade.");
  } catch (error) {
    showToast(humanError(error, "Não foi possível adicionar a leitura."));
  } finally {
    state.fermentationBusy = false;
    renderFermentation();
  }
}

async function deleteGravityReading(reading) {
  if (state.fermentationBusy || !state.selectedDeviceId) return;
  if (!window.confirm(`Excluir a leitura ${formatGravity(reading.gravity)} de ${formatDateTime(reading.measuredAt)}?`)) return;
  state.fermentationBusy = true;
  renderFermentation();
  try {
    await api(
      `/v1/devices/${encodeURIComponent(state.selectedDeviceId)}/fermentation/readings/${encodeURIComponent(reading.id)}`,
      { method: "DELETE" },
    );
    state.fermentationError = null;
    await loadFermentation();
    showToast("Leitura excluída.");
  } catch (error) {
    showToast(humanError(error, "Não foi possível excluir a leitura."));
  } finally {
    state.fermentationBusy = false;
    renderFermentation();
  }
}

async function finishFermentationTracking() {
  if (state.fermentationBusy || !state.selectedDeviceId || !state.fermentation?.active) return;
  if (!window.confirm("Encerrar este acompanhamento? As leituras e o gráfico continuarão disponíveis.")) return;
  state.fermentationBusy = true;
  renderFermentation();
  try {
    await api(
      `/v1/devices/${encodeURIComponent(state.selectedDeviceId)}/fermentation/finish`,
      {
        method: "POST",
        body: {
          finalGravity: optionalNumberInput(elements.batchFinalGravityField.value),
          actualVolumeLiters: optionalNumberInput(elements.batchActualVolumeField.value),
          sensoryScore: optionalNumberInput(elements.batchSensoryScoreField.value),
          sensoryNotes: elements.batchSensoryNotesField.value.trim(),
          summaryNotes: elements.batchSummaryField.value.trim(),
        },
      },
    );
    state.fermentationError = null;
    await loadFermentation();
    showToast("Acompanhamento encerrado.");
  } catch (error) {
    showToast(humanError(error, "Não foi possível encerrar o acompanhamento."));
  } finally {
    state.fermentationBusy = false;
    renderFermentation();
  }
}

function showNewFermentationForm() {
  state.showNewFermentationForm = true;
  elements.fermentationStartForm.reset();
  elements.fermentationNameInput.value = state.latest?.state?.profile?.name || "";
  renderBatchRecipeOptions();
  setDefaultDateTime(elements.fermentationStartedAtInput, null, true);
  renderFermentation();
  elements.fermentationNameInput.focus();
}

function parseGravityInput(value) {
  return Number(String(value).replace(",", "."));
}

function validGravity(value) {
  return Number.isFinite(value) && value >= 0.990 && value <= 1.200 &&
    Math.abs(value * 1000 - Math.round(value * 1000)) < 0.000_001;
}

function optionalNumberInput(value) {
  const normalized = String(value ?? "").trim().replace(",", ".");
  return normalized === "" ? null : Number(normalized);
}

function formatGravity(value) {
  const gravity = Number(value);
  return Number.isFinite(gravity) ? gravity.toFixed(3) : "—";
}

function epochFromDateTimeInput(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : Math.floor(date.getTime() / 1000);
}

function setDefaultDateTime(input, epochSeconds = null, force = false) {
  if (!force && input.value) return;
  const date = epochSeconds === null ? new Date() : new Date(Number(epochSeconds) * 1000);
  const two = (value) => String(value).padStart(2, "0");
  input.value = `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())}T${two(date.getHours())}:${two(date.getMinutes())}`;
}

async function handleSetpointCommand(event) {
  event.preventDefault();
  if (state.commandBusy || !state.selectedDeviceId) return;

  const data = state.latest?.state;
  const setpoint = Number(String(elements.remoteSetpoint.value).replace(",", "."));
  if (!Number.isFinite(setpoint) || setpoint < -10 || setpoint > 40) {
    showToast("Informe um setpoint entre -10,0 e 40,0 °C.");
    return;
  }
  if (Math.abs(setpoint * 10 - Math.round(setpoint * 10)) > 0.000001) {
    showToast("Use no máximo uma casa decimal.");
    return;
  }
  if (data?.profile?.active) {
    showToast("Cancele o perfil ativo antes de alterar o setpoint.");
    return;
  }
  if (!isOnline(state.latest?.receivedAt)) {
    showToast("O controlador precisa estar online.");
    return;
  }

  const confirmed = window.confirm(
    `Alterar o setpoint de ${formatNumber(data?.control?.setpoint, 1)} °C para ${formatNumber(setpoint, 1)} °C?`,
  );
  if (!confirmed) return;

  state.commandBusy = true;
  renderRemoteControl();

  try {
    const response = await api(
      `/v1/devices/${encodeURIComponent(state.selectedDeviceId)}/commands/setpoint`,
      { method: "POST", body: { setpoint: Math.round(setpoint * 10) / 10 } },
    );
    state.latest.latestCommand = response.command;
    renderRemoteControl();
    showToast("Comando enviado. Aguardando confirmação do controlador.");
    window.setTimeout(() => void refreshLatest(), 1_000);
  } catch (error) {
    showToast(humanError(error, "Não foi possível alterar o setpoint."));
  } finally {
    state.commandBusy = false;
    renderRemoteControl();
  }
}

function renderRemoteControl() {
  const snapshot = state.latest;
  const data = snapshot?.state;
  const latestCommand = snapshot?.latestCommand;
  const command = latestCommand?.type === "set_setpoint" ? latestCommand : null;
  const role = state.user?.memberships?.[0]?.role;
  const viewer = role === "viewer";
  const online = isOnline(snapshot?.receivedAt);
  const profileActive = Boolean(data?.profile?.active);
  const commandActive =
    latestCommand?.status === "pending" || latestCommand?.status === "delivered";

  const currentSetpoint = Number(data?.control?.setpoint);
  const inputIsEmpty = elements.remoteSetpoint.value.trim() === "";

  // Sempre preenche o campo na primeira leitura. Antes, um comando pendente
  // impedia o preenchimento e fazia o painel exibir o input vazio.
  if (
    Number.isFinite(currentSetpoint) &&
    document.activeElement !== elements.remoteSetpoint &&
    (!commandActive || inputIsEmpty)
  ) {
    elements.remoteSetpoint.value = currentSetpoint.toFixed(1);
  }

  const disabled =
    !data || !online || profileActive || viewer || commandActive || state.commandBusy;
  elements.remoteSetpoint.disabled = disabled;
  elements.setpointCommandButton.disabled = disabled;
  elements.setpointCommandButton.textContent = state.commandBusy
    ? "ENVIANDO…"
    : commandActive
      ? "AGUARDANDO…"
      : "ALTERAR";

  let badge = "PRONTO";
  let kind = "neutral";
  let message = "O ESP32 validará e confirmará a alteração.";

  if (!data) {
    badge = "AGUARDANDO";
    message = "Carregando o estado do controlador.";
  } else if (!online) {
    badge = "OFFLINE";
    kind = "rejected";
    message = "O controle remoto fica bloqueado enquanto o ESP32 está offline.";
  } else if (profileActive) {
    badge = "PERFIL ATIVO";
    kind = "pending";
    message = "Cancele o perfil antes de alterar manualmente o setpoint.";
  } else if (viewer) {
    badge = "SOMENTE LEITURA";
    message = "Seu perfil não possui permissão para controlar dispositivos.";
  } else if (command) {
    const requested = formatNumber(command.payload?.setpoint, 1);
    if (command.status === "pending") {
      badge = "NA FILA";
      kind = "pending";
      message = `Solicitação de ${requested} °C aguardando o controlador.`;
    } else if (command.status === "delivered") {
      badge = "ENTREGUE";
      kind = "pending";
      message = `O ESP32 recebeu ${requested} °C e está processando.`;
    } else if (command.status === "applied") {
      badge = "APLICADO";
      kind = "applied";
      message = command.result?.message || `Setpoint de ${requested} °C aplicado.`;
    } else if (command.status === "rejected") {
      badge = "REJEITADO";
      kind = "rejected";
      message = command.result?.message || "O controlador rejeitou o comando.";
    } else if (command.status === "expired") {
      badge = "EXPIRADO";
      kind = "rejected";
      message = "O controlador não confirmou o comando dentro do prazo.";
    }
  }

  elements.commandBadge.classList.remove("neutral", "pending", "applied", "rejected");
  elements.commandBadge.classList.add(kind);
  elements.commandBadge.textContent = badge;
  elements.commandStatusText.textContent = message;
}

function configurationSnapshot() {
  const data = state.latest?.state || {};
  const control = data.control || {};
  const temperatures = data.temperatures || {};
  const alarms = data.alarms?.configuration || {};
  const finite = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  return {
    hysteresis: finite(control.hysteresis, 0.5),
    compressorProtectionSeconds: Math.round(finite(control.compressorProtectionDurationSeconds, 60)),
    refrigeratorOffset: finite(temperatures.refrigerator?.offset, 0),
    thermalWellOffset: finite(temperatures.thermalWell?.offset, 0),
    sensorAlarmEnabled: alarms.sensorAlarmEnabled ?? true,
    highTemperatureEnabled: alarms.highTemperatureEnabled ?? true,
    lowTemperatureEnabled: alarms.lowTemperatureEnabled ?? true,
    responseAlarmEnabled: alarms.responseAlarmEnabled ?? true,
    highTemperatureLimit: finite(alarms.highTemperatureLimit, 35),
    lowTemperatureLimit: finite(alarms.lowTemperatureLimit, -5),
    minimumExpectedChange: finite(alarms.minimumExpectedChange, 0.5),
    responseTimeoutSeconds: Math.round(finite(alarms.responseTimeoutSeconds, 5400)),
  };
}

function commandIsActive() {
  const status = state.latest?.latestCommand?.status;
  return status === "pending" || status === "delivered";
}

function configurationUnavailable() {
  const data = state.latest?.state;
  const viewer = state.user?.memberships?.[0]?.role === "viewer";
  return !data || !isOnline(state.latest?.receivedAt) || Boolean(data.profile?.active) ||
    viewer || commandIsActive() || state.configurationBusy;
}

function baseCommandUnavailable() {
  const data = state.latest?.state;
  const viewer = state.user?.memberships?.[0]?.role === "viewer";
  return !data || !isOnline(state.latest?.receivedAt) || viewer ||
    commandIsActive() || state.configurationBusy;
}

function configurationCommandPresentation() {
  const data = state.latest?.state;
  const command = state.latest?.latestCommand;
  let badge = "PRONTO";
  let kind = "neutral";
  let message = "O ESP32 validará, salvará e confirmará a configuração.";

  if (!data) return { badge: "AGUARDANDO", kind, message: "Carregando a configuração atual." };
  if (!isOnline(state.latest?.receivedAt)) {
    return { badge: "OFFLINE", kind: "rejected", message: "O controlador precisa estar online." };
  }
  if (data.profile?.active) {
    return { badge: "PERFIL ATIVO", kind: "pending", message: "Interrompa a receita antes de alterar configurações." };
  }
  if (state.user?.memberships?.[0]?.role === "viewer") {
    return { badge: "SOMENTE LEITURA", kind, message: "Seu perfil não pode alterar configurações." };
  }
  if (command?.type === "set_configuration") {
    if (command.status === "pending") {
      badge = "NA FILA"; kind = "pending"; message = "Configuração aguardando o ESP32.";
    } else if (command.status === "delivered") {
      badge = "ENTREGUE"; kind = "pending"; message = "Configuração recebida e em validação pelo ESP32.";
    } else if (command.status === "applied") {
      badge = "APLICADO"; kind = "applied"; message = command.result?.message || "Configuração aplicada.";
    } else if (command.status === "rejected") {
      badge = "REJEITADO"; kind = "rejected"; message = command.result?.message || "Configuração rejeitada.";
    } else if (command.status === "expired") {
      badge = "EXPIRADO"; kind = "rejected"; message = "O comando expirou sem confirmação.";
    }
  }
  return { badge, kind, message };
}

function setOutlineBadge(element, kind, label) {
  element.classList.remove("neutral", "pending", "applied", "rejected");
  element.classList.add(kind);
  element.textContent = label;
}

function setFormDisabled(form, disabled) {
  [...form.querySelectorAll("input, select, button")].forEach((control) => {
    control.disabled = disabled;
  });
}

function prepareFormsForDevice() {
  if (state.formDeviceId === state.selectedDeviceId) return;
  state.formDeviceId = state.selectedDeviceId;
  state.configurationDirty = false;
  state.calibrationDirty = false;
  state.alarmsDirty = false;
}

function renderConfigurationForms() {
  prepareFormsForDevice();
  const configuration = configurationSnapshot();
  if (!state.configurationDirty) {
    elements.configurationHysteresis.value = configuration.hysteresis.toFixed(1);
    elements.configurationCompressor.value = String(configuration.compressorProtectionSeconds);
  }
  setFormDisabled(elements.configurationForm, configurationUnavailable());
  const presentation = configurationCommandPresentation();
  setOutlineBadge(elements.configurationBadge, presentation.kind, presentation.badge);
  elements.configurationStatusText.textContent = presentation.message;
}

function sensorReading(value, connected) {
  return connected && Number.isFinite(Number(value)) ? `${Number(value).toFixed(2)} °C` : "—";
}

function renderCalibration() {
  prepareFormsForDevice();
  const configuration = configurationSnapshot();
  const refrigerator = state.latest?.state?.temperatures?.refrigerator || {};
  const thermalWell = state.latest?.state?.temperatures?.thermalWell || {};

  elements.refrigeratorRawReading.textContent = sensorReading(refrigerator.raw, refrigerator.connected);
  elements.refrigeratorCorrectedReading.textContent = sensorReading(refrigerator.value, refrigerator.connected);
  elements.thermalWellRawReading.textContent = sensorReading(thermalWell.raw, thermalWell.connected);
  elements.thermalWellCorrectedReading.textContent = sensorReading(thermalWell.value, thermalWell.connected);
  setOutlineBadge(elements.refrigeratorCalibrationStatus, refrigerator.connected ? "applied" : "neutral", refrigerator.connected ? "CONECTADO" : "DESCONECTADO");
  setOutlineBadge(elements.thermalWellCalibrationStatus, thermalWell.connected ? "applied" : "neutral", thermalWell.connected ? "CONECTADO" : "DESCONECTADO");

  if (!state.calibrationDirty) {
    elements.refrigeratorOffsetInput.value = configuration.refrigeratorOffset.toFixed(2);
    elements.thermalWellOffsetInput.value = configuration.thermalWellOffset.toFixed(2);
  }
  setFormDisabled(elements.calibrationForm, configurationUnavailable());
  const presentation = configurationCommandPresentation();
  setOutlineBadge(elements.calibrationBadge, presentation.kind, presentation.badge);
  elements.calibrationStatusText.textContent = presentation.message;
}

function renderAlarmSettings() {
  prepareFormsForDevice();
  const configuration = configurationSnapshot();
  const alarms = state.latest?.state?.alarms || {};
  if (!state.alarmsDirty) {
    elements.sensorAlarmEnabled.checked = Boolean(configuration.sensorAlarmEnabled);
    elements.highTemperatureEnabled.checked = Boolean(configuration.highTemperatureEnabled);
    elements.lowTemperatureEnabled.checked = Boolean(configuration.lowTemperatureEnabled);
    elements.responseAlarmEnabled.checked = Boolean(configuration.responseAlarmEnabled);
    elements.highTemperatureLimit.value = configuration.highTemperatureLimit.toFixed(1);
    elements.lowTemperatureLimit.value = configuration.lowTemperatureLimit.toFixed(1);
    elements.minimumExpectedChange.value = configuration.minimumExpectedChange.toFixed(1);
    elements.responseTimeoutMinutes.value = String(Math.round(configuration.responseTimeoutSeconds / 60));
  }
  setFormDisabled(elements.alarmSettingsForm, configurationUnavailable());
  elements.acknowledgeAlarmsButton.disabled = baseCommandUnavailable() || !alarms.unacknowledged;
  elements.alarmDetailedSummary.textContent = alarms.summary || (alarms.active ? "Alarme ativo." : "Nenhum alarme ativo.");
  const presentation = configurationCommandPresentation();
  setOutlineBadge(elements.alarmSettingsBadge, presentation.kind, presentation.badge);
  elements.alarmSettingsStatusText.textContent = presentation.message;
}

function renderDeviceDetails() {
  const data = state.latest?.state;
  const refrigerator = data?.temperatures?.refrigerator;
  const thermalWell = data?.temperatures?.thermalWell;
  elements.deviceRefrigeratorSensor.textContent = refrigerator?.connected
    ? `Conectado · bruto ${sensorReading(refrigerator.raw, true)}` : "Desconectado";
  elements.deviceThermalWellSensor.textContent = thermalWell?.connected
    ? `Conectado · bruto ${sensorReading(thermalWell.raw, true)}` : "Desconectado";
  elements.deviceCompressorDuration.textContent = Number.isFinite(Number(data?.control?.compressorProtectionDurationSeconds))
    ? `${Number(data.control.compressorProtectionDurationSeconds)} s` : "—";
  elements.deviceSignal.textContent = Number.isFinite(Number(data?.network?.rssi))
    ? `${Number(data.network.rssi)} dBm · ${signalDetails(Number(data.network.rssi)).label}` : "—";
}

async function sendConfiguration(overrides, confirmation, scope) {
  if (state.configurationBusy || !state.selectedDeviceId) return false;
  if (configurationUnavailable()) {
    showToast("O controlador precisa estar online, sem receita ativa e sem outro comando pendente.");
    return false;
  }
  const payload = { ...configurationSnapshot(), ...overrides };
  if (!window.confirm(confirmation)) return false;

  state.configurationBusy = true;
  renderConfigurationForms();
  renderCalibration();
  renderAlarmSettings();
  try {
    const response = await api(
      `/v1/devices/${encodeURIComponent(state.selectedDeviceId)}/commands/configuration`,
      { method: "POST", body: payload },
    );
    state.pendingConfigurationCommandId = response.command.id;
    state.pendingConfigurationScope = scope;
    state.latest.latestCommand = response.command;
    showToast("Configuração enviada. Aguardando confirmação do ESP32.");
    window.setTimeout(() => void refreshLatest(), 1_000);
    return true;
  } catch (error) {
    showToast(humanError(error, "Não foi possível enviar a configuração."));
    return false;
  } finally {
    state.configurationBusy = false;
    renderConfigurationForms();
    renderCalibration();
    renderAlarmSettings();
  }
}

async function handleConfigurationSave(event) {
  event.preventDefault();
  if (!elements.configurationForm.reportValidity()) return;
  const hysteresis = Number(elements.configurationHysteresis.value);
  const compressorProtectionSeconds = Number(elements.configurationCompressor.value);
  if (!Number.isFinite(hysteresis) || hysteresis < 0.1 || hysteresis > 5 ||
      !Number.isInteger(compressorProtectionSeconds) || compressorProtectionSeconds < 60 || compressorProtectionSeconds > 900) {
    showToast("Use histerese de 0,1 a 5,0 °C e proteção de 60 a 900 segundos.");
    return;
  }
  await sendConfiguration(
    { hysteresis: Math.round(hysteresis * 10) / 10, compressorProtectionSeconds },
    `Aplicar histerese de ${hysteresis.toFixed(1)} °C e proteção de ${compressorProtectionSeconds} segundos?`,
    "control",
  );
}

async function handleCalibrationSave(event) {
  event.preventDefault();
  if (!elements.calibrationForm.reportValidity()) return;
  const refrigeratorOffset = Number(elements.refrigeratorOffsetInput.value);
  const thermalWellOffset = Number(elements.thermalWellOffsetInput.value);
  if (![refrigeratorOffset, thermalWellOffset].every((value) => Number.isFinite(value) && value >= -10 && value <= 10)) {
    showToast("Use offsets entre -10,00 e +10,00 °C.");
    return;
  }
  await sendConfiguration(
    {
      refrigeratorOffset: Math.round(refrigeratorOffset * 100) / 100,
      thermalWellOffset: Math.round(thermalWellOffset * 100) / 100,
    },
    `Aplicar os offsets de ${refrigeratorOffset.toFixed(2)} °C e ${thermalWellOffset.toFixed(2)} °C?`,
    "calibration",
  );
}

async function resetCalibration() {
  const sent = await sendConfiguration(
    { refrigeratorOffset: 0, thermalWellOffset: 0 },
    "Zerar a calibração dos sensores da geladeira e do poço térmico?",
    "calibration",
  );
  if (sent) {
    elements.refrigeratorOffsetInput.value = "0.00";
    elements.thermalWellOffsetInput.value = "0.00";
    state.calibrationDirty = true;
  }
}

async function handleAlarmSettingsSave(event) {
  event.preventDefault();
  if (!elements.alarmSettingsForm.reportValidity()) return;
  const highTemperatureLimit = Number(elements.highTemperatureLimit.value);
  const lowTemperatureLimit = Number(elements.lowTemperatureLimit.value);
  const minimumExpectedChange = Number(elements.minimumExpectedChange.value);
  const responseTimeoutMinutes = Number(elements.responseTimeoutMinutes.value);
  if (highTemperatureLimit <= lowTemperatureLimit) {
    showToast("O limite alto deve ser maior que o limite baixo.");
    return;
  }
  if (!Number.isInteger(responseTimeoutMinutes) || responseTimeoutMinutes < 1 || responseTimeoutMinutes > 1440) {
    showToast("Use um tempo de resposta entre 1 e 1440 minutos.");
    return;
  }
  await sendConfiguration(
    {
      sensorAlarmEnabled: elements.sensorAlarmEnabled.checked,
      highTemperatureEnabled: elements.highTemperatureEnabled.checked,
      lowTemperatureEnabled: elements.lowTemperatureEnabled.checked,
      responseAlarmEnabled: elements.responseAlarmEnabled.checked,
      highTemperatureLimit: Math.round(highTemperatureLimit * 10) / 10,
      lowTemperatureLimit: Math.round(lowTemperatureLimit * 10) / 10,
      minimumExpectedChange: Math.round(minimumExpectedChange * 10) / 10,
      responseTimeoutSeconds: responseTimeoutMinutes * 60,
    },
    "Aplicar esta configuração de alarmes no controlador?",
    "alarms",
  );
}

async function acknowledgeAlarms() {
  if (baseCommandUnavailable()) return;
  if (!window.confirm("Reconhecer os alarmes atuais neste controlador?")) return;
  state.configurationBusy = true;
  renderAlarmSettings();
  try {
    const response = await api(
      `/v1/devices/${encodeURIComponent(state.selectedDeviceId)}/commands/alarms`,
      { method: "POST", body: { action: "acknowledge" } },
    );
    state.latest.latestCommand = response.command;
    showToast("Reconhecimento enviado. Aguardando o ESP32.");
    window.setTimeout(() => void refreshLatest(), 1_000);
  } catch (error) {
    showToast(humanError(error, "Não foi possível reconhecer os alarmes."));
  } finally {
    state.configurationBusy = false;
    renderAlarmSettings();
  }
}

function announceCommandTransition(previous, current) {
  if (!previous || !current || previous.id !== current.id || previous.status === current.status) return;
  const appliedMessages = {
    set_setpoint: "Setpoint confirmado e aplicado pelo controlador.",
    start_profile: "Receita iniciada pelo controlador.",
    pause_profile: "Receita pausada pelo controlador.",
    resume_profile: "Receita retomada pelo controlador.",
    stop_profile: "Receita interrompida pelo controlador.",
    set_configuration: "Configuração confirmada e aplicada pelo controlador.",
    acknowledge_alarms: "Alarmes reconhecidos pelo controlador.",
  };
  if (current.status === "applied") {
    showToast(current.result?.message || appliedMessages[current.type] || "Comando aplicado pelo controlador.");
  } else if (current.status === "rejected") {
    showToast(current.result?.message || "O controlador rejeitou o comando.");
  } else if (current.status === "expired") {
    showToast("O comando expirou sem confirmação.");
  }
}

function renderRecipes() {
  const role = state.user?.memberships?.[0]?.role;
  const viewer = role === "viewer";
  const data = state.latest?.state;
  const profileActive = Boolean(data?.profile?.active);
  const online = isOnline(state.latest?.receivedAt);
  const command = state.latest?.latestCommand;
  const commandActive = command?.status === "pending" || command?.status === "delivered";

  elements.recipeCount.textContent = String(state.recipes.length);
  elements.recipeList.replaceChildren();
  elements.recipeEmpty.hidden = state.recipes.length > 0;
  elements.newRecipeButton.disabled = viewer || state.recipeBusy;

  for (const recipe of state.recipes) {
    const item = document.createElement("article");
    item.className = "recipe-item";

    const top = document.createElement("div");
    top.className = "recipe-item-top";
    const copy = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = recipe.name;
    const description = document.createElement("p");
    description.textContent = recipe.description || "Sem descrição.";
    copy.append(title, description);
    const version = document.createElement("span");
    version.className = "outline-badge neutral";
    version.textContent = `v${recipe.version}`;
    top.append(copy, version);

    const totalSeconds = (recipe.stages || [])
      .reduce((total, stage) => total + Number(stage.durationSeconds || 0), 0);
    const meta = document.createElement("div");
    meta.className = "recipe-meta";
    meta.append(
      textSpan(`${recipe.stages?.length || 0} etapa${recipe.stages?.length === 1 ? "" : "s"}`),
      textSpan(`Duração ${formatDuration(totalSeconds)}`),
    );

    const actions = document.createElement("div");
    actions.className = "recipe-card-actions";
    const start = actionButton("INICIAR", "start-recipe-button");
    const edit = actionButton("EDITAR");
    const remove = actionButton("EXCLUIR", "delete-recipe-button");
    const runningThisRecipe = profileActive && data?.profile?.name === recipe.name;

    start.disabled =
      !state.selectedDeviceId || !online || profileActive || viewer ||
      commandActive || state.profileCommandBusy;
    edit.disabled = viewer || state.recipeBusy || runningThisRecipe;
    remove.disabled = viewer || state.recipeBusy || runningThisRecipe;

    start.addEventListener("click", () => void sendProfileCommand("start", recipe.id));
    edit.addEventListener("click", () => openRecipeForm(recipe));
    remove.addEventListener("click", () => void deleteCloudRecipe(recipe));
    actions.append(start, edit, remove);
    item.append(top, meta, actions);
    elements.recipeList.append(item);
  }
}

function openRecipeForm(recipe = null) {
  if (state.user?.memberships?.[0]?.role === "viewer") {
    showToast("Seu perfil possui acesso somente para leitura.");
    return;
  }
  elements.recipeForm.hidden = false;
  elements.recipeId.value = recipe?.id || "";
  elements.recipeName.value = recipe?.name || "";
  elements.recipeDescription.value = recipe?.description || "";
  elements.recipeFormTitle.textContent = recipe ? "Editar receita" : "Nova receita";
  elements.recipeStages.replaceChildren();

  const stages = recipe?.stages?.length
    ? recipe.stages
    : [{ name: "Fermentação", targetTemperature: 18, durationSeconds: 604800 }];
  stages.forEach((stage) => addStageRow(stage));
  elements.recipeName.focus();
  elements.recipeForm.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function closeRecipeForm() {
  elements.recipeForm.hidden = true;
  elements.recipeForm.reset();
  elements.recipeId.value = "";
  elements.recipeStages.replaceChildren();
}

function addStageRow(stage = null) {
  if (elements.recipeStages.children.length >= 8) {
    showToast("Cada receita pode possuir no máximo oito etapas.");
    return;
  }
  const row = document.createElement("div");
  row.className = "recipe-stage-row";
  row.innerHTML = `
    <div class="stage-field stage-name-field">
      <label>NOME</label>
      <input class="stage-name" maxlength="40" required />
    </div>
    <div class="stage-field">
      <label>TEMPERATURA</label>
      <input class="stage-temperature" type="number" min="-10" max="40" step="0.1" required />
    </div>
    <div class="stage-field">
      <label>DURAÇÃO</label>
      <input class="stage-duration" type="number" min="1" step="1" required />
    </div>
    <div class="stage-field">
      <label>UNIDADE</label>
      <select class="stage-unit">
        <option value="60">minutos</option>
        <option value="3600">horas</option>
        <option value="86400">dias</option>
      </select>
    </div>
  `;
  const remove = actionButton("×", "stage-remove-button");
  remove.type = "button";
  remove.setAttribute("aria-label", "Remover etapa");
  remove.addEventListener("click", () => {
    if (elements.recipeStages.children.length <= 1) {
      showToast("A receita precisa possuir pelo menos uma etapa.");
      return;
    }
    row.remove();
  });
  row.append(remove);

  const duration = durationForEditor(Number(stage?.durationSeconds || 3600));
  row.querySelector(".stage-name").value =
    stage?.name || `Etapa ${elements.recipeStages.children.length + 1}`;
  row.querySelector(".stage-temperature").value =
    Number(stage?.targetTemperature ?? 18).toFixed(1);
  row.querySelector(".stage-duration").value = String(duration.value);
  row.querySelector(".stage-unit").value = String(duration.factor);
  elements.recipeStages.append(row);
}

async function handleRecipeSave(event) {
  event.preventDefault();
  if (state.recipeBusy) return;

  let body;
  try {
    body = recipeFormValue();
  } catch (error) {
    showToast(humanError(error, "Revise os dados da receita."));
    return;
  }

  const recipeId = elements.recipeId.value;
  state.recipeBusy = true;
  elements.saveRecipeButton.disabled = true;
  elements.saveRecipeButton.textContent = "SALVANDO…";
  renderRecipes();

  try {
    await api(recipeId ? `/v1/recipes/${encodeURIComponent(recipeId)}` : "/v1/recipes", {
      method: recipeId ? "PUT" : "POST",
      body,
    });
    await loadRecipes();
    closeRecipeForm();
    showToast(recipeId ? "Receita atualizada na nuvem." : "Receita criada na nuvem.");
  } catch (error) {
    showToast(humanError(error, "Não foi possível salvar a receita."));
  } finally {
    state.recipeBusy = false;
    elements.saveRecipeButton.disabled = false;
    elements.saveRecipeButton.textContent = "SALVAR RECEITA NA NUVEM";
    renderRecipes();
  }
}

function recipeFormValue() {
  const name = elements.recipeName.value.trim();
  if (name.length < 2 || name.length > 31) {
    throw new AppError(400, "INVALID_RECIPE_NAME", "O nome deve ter entre 2 e 31 caracteres.");
  }
  const rows = [...elements.recipeStages.querySelectorAll(".recipe-stage-row")];
  if (rows.length < 1 || rows.length > 8) {
    throw new AppError(400, "INVALID_RECIPE_STAGES", "A receita deve possuir entre uma e oito etapas.");
  }
  const stages = rows.map((row, index) => {
    const stageName = row.querySelector(".stage-name").value.trim();
    const targetTemperature = Number(row.querySelector(".stage-temperature").value);
    const durationValue = Number(row.querySelector(".stage-duration").value);
    const durationFactor = Number(row.querySelector(".stage-unit").value);
    const durationSeconds = durationValue * durationFactor;

    if (!stageName || stageName.length > 40) {
      throw new AppError(400, "INVALID_STAGE_NAME", `Revise o nome da etapa ${index + 1}.`);
    }
    if (
      !Number.isFinite(targetTemperature) || targetTemperature < -10 || targetTemperature > 40 ||
      Math.abs(targetTemperature * 10 - Math.round(targetTemperature * 10)) > 0.000001
    ) {
      throw new AppError(400, "INVALID_STAGE_TEMPERATURE", `Revise a temperatura da etapa ${index + 1}.`);
    }
    if (
      !Number.isInteger(durationValue) || ![60, 3600, 86400].includes(durationFactor) ||
      durationSeconds < 60 || durationSeconds > 7_776_000
    ) {
      throw new AppError(400, "INVALID_STAGE_DURATION", `Revise a duração da etapa ${index + 1}.`);
    }
    return {
      name: stageName,
      targetTemperature: Math.round(targetTemperature * 10) / 10,
      durationSeconds,
    };
  });
  return {
    name,
    description: elements.recipeDescription.value.trim(),
    stages,
  };
}

async function deleteCloudRecipe(recipe) {
  if (!window.confirm(`Excluir definitivamente a receita “${recipe.name}” da nuvem?`)) return;
  state.recipeBusy = true;
  renderRecipes();
  try {
    await api(`/v1/recipes/${encodeURIComponent(recipe.id)}`, { method: "DELETE" });
    if (elements.recipeId.value === recipe.id) closeRecipeForm();
    await loadRecipes();
    showToast("Receita excluída.");
  } catch (error) {
    showToast(humanError(error, "Não foi possível excluir a receita."));
  } finally {
    state.recipeBusy = false;
    renderRecipes();
  }
}

async function sendProfileCommand(action, recipeId = null) {
  if (state.profileCommandBusy || !state.selectedDeviceId) return;
  const data = state.latest?.state;
  if (!isOnline(state.latest?.receivedAt)) {
    showToast("O controlador precisa estar online para receber o comando.");
    return;
  }

  const recipe = state.recipes.find((item) => item.id === recipeId);
  const prompts = {
    start: recipe ? `Iniciar a receita “${recipe.name}” neste controlador?` : "Iniciar esta receita?",
    pause: "Pausar a contagem do perfil atual?",
    resume: "Continuar a execução do perfil pausado?",
    stop: `Interromper o perfil “${data?.profile?.name || "atual"}”? O controlador voltará ao setpoint manual salvo.`,
  };
  if (!window.confirm(prompts[action])) return;

  state.profileCommandBusy = true;
  renderProfileControls();
  renderRecipes();
  try {
    const response = await api(
      `/v1/devices/${encodeURIComponent(state.selectedDeviceId)}/commands/profile`,
      {
        method: "POST",
        body: { action, ...(recipeId ? { recipeId } : {}) },
      },
    );
    state.latest.latestCommand = response.command;
    renderProfileControls();
    renderRecipes();
    showToast("Comando enviado. Aguardando confirmação do ESP32.");
    window.setTimeout(() => void refreshLatest(), 1_000);
  } catch (error) {
    showToast(humanError(error, "Não foi possível enviar o comando de perfil."));
  } finally {
    state.profileCommandBusy = false;
    renderProfileControls();
    renderRecipes();
  }
}

function renderProfileControls() {
  const snapshot = state.latest;
  const profile = snapshot?.state?.profile;
  const role = state.user?.memberships?.[0]?.role;
  const viewer = role === "viewer";
  const online = isOnline(snapshot?.receivedAt);
  const command = snapshot?.latestCommand;
  const profileCommand = command?.type?.endsWith("_profile") ? command : null;
  const commandActive = command?.status === "pending" || command?.status === "delivered";
  const active = Boolean(profile?.active);
  const paused = Boolean(profile?.paused);
  const unavailable = !profile || !online || viewer || commandActive || state.profileCommandBusy;

  elements.pauseProfileButton.disabled = unavailable || !active || paused;
  elements.resumeProfileButton.disabled = unavailable || !active || !paused;
  elements.stopProfileButton.disabled = unavailable || !active;

  let badge = active ? (paused ? "PAUSADO" : "EM EXECUÇÃO") : "PRONTO";
  let kind = active ? "pending" : "neutral";
  let message = active
    ? `${profile.name || "Perfil"} · etapa ${Number(profile.stage || 0) + 1} de ${profile.stageCount || 0} · restante ${formatDuration(profile.remainingSeconds)}.`
    : "Selecione uma receita da biblioteca para iniciar.";

  if (!profile) {
    badge = "AGUARDANDO";
    message = "Carregando o estado do controlador.";
  } else if (!online) {
    badge = "OFFLINE";
    kind = "rejected";
    message = "Os comandos ficam bloqueados enquanto o controlador está offline.";
  } else if (viewer) {
    badge = "SOMENTE LEITURA";
    kind = "neutral";
    message = "Seu perfil não possui permissão para controlar dispositivos.";
  } else if (profileCommand) {
    const label = profileCommandLabel(profileCommand.type);
    if (profileCommand.status === "pending") {
      badge = "NA FILA";
      kind = "pending";
      message = `${label} aguardando o ESP32.`;
    } else if (profileCommand.status === "delivered") {
      badge = "ENTREGUE";
      kind = "pending";
      message = `${label} recebido e em validação pelo ESP32.`;
    } else if (profileCommand.status === "applied") {
      badge = "APLICADO";
      kind = "applied";
      message = profileCommand.result?.message || `${label} confirmado.`;
    } else if (profileCommand.status === "rejected") {
      badge = "REJEITADO";
      kind = "rejected";
      message = profileCommand.result?.message || "O ESP32 rejeitou o comando.";
    } else if (profileCommand.status === "expired") {
      badge = "EXPIRADO";
      kind = "rejected";
      message = "O controlador não confirmou o comando dentro do prazo.";
    }
  }

  elements.profileCommandBadge.classList.remove("neutral", "pending", "applied", "rejected");
  elements.profileCommandBadge.classList.add(kind);
  elements.profileCommandBadge.textContent = badge;
  elements.profileCommandText.textContent = message;
}

function profileCommandLabel(type) {
  return ({
    start_profile: "Início do perfil",
    pause_profile: "Pausa do perfil",
    resume_profile: "Retomada do perfil",
    stop_profile: "Interrupção do perfil",
  })[type] || "Comando de perfil";
}

function durationForEditor(seconds) {
  if (seconds % 86400 === 0) return { value: seconds / 86400, factor: 86400 };
  if (seconds % 3600 === 0) return { value: seconds / 3600, factor: 3600 };
  return { value: Math.max(1, Math.round(seconds / 60)), factor: 60 };
}

function actionButton(label, className = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  if (className) button.className = className;
  return button;
}

function textSpan(value) {
  const span = document.createElement("span");
  span.textContent = value;
  return span;
}

function updateTimeSensitiveUi() {
  const gravityReadings = state.fermentation?.readings;
  const lastGravityReading = Array.isArray(gravityReadings) ? gravityReadings.at(-1) : null;
  if (lastGravityReading) elements.gravityReadingAge.textContent = timeAgo(lastGravityReading.measuredAt);
  if (!state.chartPaused && state.history.length) renderChart();

  const receivedAt = state.latest?.receivedAt;
  if (!receivedAt) return;

  renderConnectionStatus(connectionStatus(receivedAt));
  elements.lastUpdate.textContent = `${formatDateTime(receivedAt)} · ${timeAgo(receivedAt)}`;
}

function renderAlarms(alarms) {
  const active = Boolean(alarms?.active);
  const count = Number(alarms?.count || 0);
  elements.alarmCard.classList.toggle("active", active);
  elements.alarmBadge.textContent = active ? `${count} ATIVO${count === 1 ? "" : "S"}` : "NORMAL";
  elements.alarmSymbol.textContent = active ? "!" : "✓";
  elements.alarmTitle.textContent = active ? "Atenção necessária" : "Sistema normal";
  elements.alarmText.textContent = active
    ? alarms?.summary || `${count} alarme${count === 1 ? " está" : "s estão"} ativo${count === 1 ? "" : "s"} no controlador.`
    : "Nenhum alarme ativo no controlador.";
}

function renderChart() {
  const window = temperatureChartWindow();
  const points = [...state.history]
    .reverse()
    .filter((point) => {
      const timestamp = Number(point.receivedAt);
      return point.refrigeratorValue !== null &&
        Number.isFinite(Number(point.refrigeratorValue)) &&
        point.setpoint !== null &&
        Number.isFinite(Number(point.setpoint)) &&
        (!Number.isFinite(window.start) || timestamp >= window.start) &&
        (!Number.isFinite(window.end) || timestamp <= window.end);
    });

  renderTemperatureChart(points, {
    grid: elements.chartGrid,
    labels: elements.chartLabels,
    temperaturePath: elements.temperaturePath,
    targetPath: elements.targetPath,
    empty: elements.chartEmpty,
    height: 300,
    startTime: window.start,
    endTime: window.end,
  });
  renderTemperatureChart(points, {
    grid: elements.dashboardChartGrid,
    labels: elements.dashboardChartLabels,
    temperaturePath: elements.dashboardTemperaturePath,
    targetPath: elements.dashboardTargetPath,
    empty: elements.dashboardChartEmpty,
    height: 260,
    startTime: window.start,
    endTime: window.end,
  });
}

function temperatureChartBaseWindow() {
  const currentTime = state.chartPaused
    ? state.chartPausedAt
    : Math.floor(Date.now() / 1000);
  const end = Number.isFinite(currentTime)
    ? Math.max(currentTime, Number(state.historyTo) || 0)
    : state.historyTo;
  if (state.historyRange === "all") {
    return { start: state.historyFrom, end };
  }
  const rangeSeconds = Number(state.historyRange);
  return {
    start: Number.isFinite(end) && Number.isFinite(rangeSeconds) ? end - rangeSeconds : state.historyFrom,
    end,
  };
}

function temperatureChartWindow() {
  const base = temperatureChartBaseWindow();
  if (
    Number.isFinite(state.chartViewportStart) &&
    Number.isFinite(state.chartViewportEnd) &&
    state.chartViewportEnd > state.chartViewportStart
  ) {
    return {
      start: state.chartViewportStart,
      end: state.chartViewportEnd,
    };
  }
  return base;
}

function resetChartViewport() {
  state.chartViewportStart = null;
  state.chartViewportEnd = null;
  document.querySelectorAll(".chart-wrap").forEach((wrap) => wrap.classList.remove("zoomed"));
}

function initializeTemperatureChartInteractions() {
  for (const [svg, wrap] of [
    [elements.temperatureChart, elements.chartWrap],
    [elements.dashboardTemperatureChart, elements.dashboardChartWrap],
  ]) {
    if (!svg || !wrap) continue;
    const overlay = document.createElementNS(SVG_NS, "g");
    overlay.classList.add("chart-inspector");
    const line = document.createElementNS(SVG_NS, "line");
    line.classList.add("chart-inspector-line");
    const temperaturePoint = document.createElementNS(SVG_NS, "circle");
    temperaturePoint.classList.add("chart-inspector-point", "temperature-point");
    temperaturePoint.setAttribute("r", "5");
    const setpointPoint = document.createElementNS(SVG_NS, "circle");
    setpointPoint.classList.add("chart-inspector-point", "setpoint-point");
    setpointPoint.setAttribute("r", "4");
    overlay.append(line, temperaturePoint, setpointPoint);
    overlay.hidden = true;
    svg.append(overlay);

    const tooltip = document.createElement("div");
    tooltip.className = "chart-tooltip";
    tooltip.hidden = true;
    tooltip.setAttribute("role", "status");
    wrap.append(tooltip);

    temperatureChartInteractions.set(svg, {
      wrap,
      overlay,
      line,
      temperaturePoint,
      setpointPoint,
      tooltip,
      model: null,
    });

    svg.addEventListener("pointermove", handleTemperatureChartPointerMove);
    svg.addEventListener("pointerleave", hideTemperatureChartInspector);
    svg.addEventListener("wheel", handleTemperatureChartWheel, { passive: false });
    svg.addEventListener("dblclick", () => {
      resetChartViewport();
      renderChart();
      showToast("Escala de tempo restaurada.");
    });
  }
}

function handleTemperatureChartWheel(event) {
  const interaction = temperatureChartInteractions.get(event.currentTarget);
  const model = interaction?.model;
  if (!model || model.points.length < 2) return;
  event.preventDefault();

  const base = temperatureChartBaseWindow();
  if (!Number.isFinite(base.start) || !Number.isFinite(base.end) || base.end <= base.start) return;
  const current = temperatureChartWindow();
  const currentSpan = current.end - current.start;
  const maximumSpan = base.end - base.start;
  const minimumSpan = Math.min(15, maximumSpan);
  const factor = event.deltaY > 0 ? 1.28 : 0.78;
  const nextSpan = Math.min(Math.max(currentSpan * factor, minimumSpan), maximumSpan);

  if (nextSpan >= maximumSpan * 0.995) {
    resetChartViewport();
    renderChart();
    return;
  }

  const bounds = event.currentTarget.getBoundingClientRect();
  const svgX = (event.clientX - bounds.left) / bounds.width * model.width;
  const pointerRatio = Math.min(Math.max((svgX - model.pad.left) / model.plotWidth, 0), 1);
  const anchor = current.start + currentSpan * pointerRatio;
  let start = anchor - nextSpan * pointerRatio;
  let end = start + nextSpan;
  if (start < base.start) {
    start = base.start;
    end = start + nextSpan;
  }
  if (end > base.end) {
    end = base.end;
    start = end - nextSpan;
  }

  state.chartViewportStart = start;
  state.chartViewportEnd = end;
  document.querySelectorAll(".chart-wrap").forEach((wrap) => wrap.classList.add("zoomed"));
  renderChart();
}

function handleTemperatureChartPointerMove(event) {
  const svg = event.currentTarget;
  const interaction = temperatureChartInteractions.get(svg);
  const model = interaction?.model;
  if (!interaction || !model || !model.points.length) return;

  const bounds = svg.getBoundingClientRect();
  const svgX = (event.clientX - bounds.left) / bounds.width * model.width;
  const timestamp = model.domainStart +
    ((svgX - model.pad.left) / model.plotWidth) * model.timeSpanSeconds;
  const point = model.points.reduce((closest, candidate) =>
    Math.abs(Number(candidate.receivedAt) - timestamp) < Math.abs(Number(closest.receivedAt) - timestamp)
      ? candidate
      : closest,
  );
  const temperature = Number(point.refrigeratorValue);
  const setpoint = Number(point.setpoint);
  const delta = temperature - setpoint;
  const pointX = model.x(point.receivedAt);
  const temperatureY = model.y(temperature);
  const setpointY = model.y(setpoint);

  interaction.line.setAttribute("x1", pointX);
  interaction.line.setAttribute("x2", pointX);
  interaction.line.setAttribute("y1", model.pad.top);
  interaction.line.setAttribute("y2", model.height - model.pad.bottom);
  interaction.temperaturePoint.setAttribute("cx", pointX);
  interaction.temperaturePoint.setAttribute("cy", temperatureY);
  interaction.setpointPoint.setAttribute("cx", pointX);
  interaction.setpointPoint.setAttribute("cy", setpointY);
  interaction.overlay.hidden = false;

  interaction.tooltip.replaceChildren(
    createChartTooltipRow("Valor atual", `${formatNumber(temperature, 2)} °C`),
    createChartTooltipRow("Setpoint", `${formatNumber(setpoint, 2)} °C`),
    createChartTooltipRow("Delta", `${delta >= 0 ? "+" : ""}${formatNumber(delta, 2)} °C`),
    createChartTooltipRow("Horário", formatDateTime(point.receivedAt)),
  );
  interaction.tooltip.hidden = false;
  const wrapBounds = interaction.wrap.getBoundingClientRect();
  const requestedLeft = event.clientX - wrapBounds.left + interaction.wrap.scrollLeft + 14;
  const maximumLeft = interaction.wrap.scrollLeft + interaction.wrap.clientWidth - 224;
  interaction.tooltip.style.left = `${Math.max(interaction.wrap.scrollLeft + 8, Math.min(requestedLeft, maximumLeft))}px`;
  interaction.tooltip.style.top = `${Math.max(8, event.clientY - wrapBounds.top - 44)}px`;
}

function createChartTooltipRow(label, value) {
  const row = document.createElement("span");
  const key = document.createElement("small");
  key.textContent = label;
  const content = document.createElement("b");
  content.textContent = value;
  row.append(key, content);
  return row;
}

function hideTemperatureChartInspector(event) {
  const interaction = temperatureChartInteractions.get(event.currentTarget);
  if (!interaction) return;
  interaction.overlay.hidden = true;
  interaction.tooltip.hidden = true;
}

function toggleChartPause() {
  state.chartPaused = !state.chartPaused;
  state.chartPausedAt = state.chartPaused ? Math.floor(Date.now() / 1000) : null;
  state.chartRevision += 1;

  if (state.chartPaused) {
    if (state.historyTimer) window.clearInterval(state.historyTimer);
    state.historyTimer = null;
    showToast("Gráfico pausado. O controlador continua funcionando normalmente.");
  } else {
    scheduleHistoryRefresh();
    void loadHistory(false);
    showToast("Gráfico retomado em tempo real.");
  }

  updateChartLiveControls();
  renderChart();
}

function updateChartLiveControls() {
  document.querySelectorAll("[data-chart-live-status]").forEach((status) => {
    status.textContent = state.chartPaused ? "● PAUSADO" : "● AO VIVO";
    status.classList.toggle("paused", state.chartPaused);
  });
  document.querySelectorAll("[data-chart-pause]").forEach((button) => {
    button.textContent = state.chartPaused ? "RETOMAR" : "PAUSAR";
    button.setAttribute("aria-pressed", state.chartPaused ? "true" : "false");
  });
  document.querySelectorAll("[data-temperature-range]").forEach((button) => {
    button.disabled = state.chartPaused;
  });
}

function renderTemperatureChart(points, graph) {
  const {
    grid,
    labels,
    temperaturePath: temperaturePathElement,
    targetPath: targetPathElement,
    empty,
    height,
    startTime,
    endTime,
  } = graph;
  grid.replaceChildren();
  labels.replaceChildren();
  const svg = temperaturePathElement.ownerSVGElement;
  const interaction = temperatureChartInteractions.get(svg);
  if (interaction) interaction.model = null;

  if (points.length < 2) {
    if (interaction) {
      interaction.overlay.hidden = true;
      interaction.tooltip.hidden = true;
    }
    temperaturePathElement.setAttribute("d", "");
    targetPathElement.setAttribute("d", "");
    empty.hidden = false;
    empty.textContent = points.length ? "Aguardando mais leituras…" : "Nenhuma leitura no período.";
    return;
  }

  empty.hidden = true;

  const width = 900;
  const pad = { left: 52, right: 16, top: 18, bottom: 35 };
  const values = points.flatMap((point) => [Number(point.refrigeratorValue), Number(point.setpoint)]);
  let minimum = Math.min(...values);
  let maximum = Math.max(...values);
  const span = Math.max(maximum - minimum, 2);
  minimum = Math.floor((minimum - span * 0.16) * 2) / 2;
  maximum = Math.ceil((maximum + span * 0.16) * 2) / 2;

  const plotWidth = width - pad.left - pad.right;
  const plotHeight = height - pad.top - pad.bottom;
  const firstTimestamp = Number(points[0].receivedAt);
  const lastTimestamp = Number(points[points.length - 1].receivedAt);
  const domainStart = Number.isFinite(startTime) ? startTime : firstTimestamp;
  const domainEnd = Number.isFinite(endTime) && endTime > domainStart ? endTime : lastTimestamp;
  const timeSpanSeconds = Math.max(domainEnd - domainStart, 1);
  const x = (timestamp) => {
    const ratio = Math.min(Math.max((Number(timestamp) - domainStart) / timeSpanSeconds, 0), 1);
    return pad.left + ratio * plotWidth;
  };
  const y = (value) => pad.top + ((maximum - value) / (maximum - minimum)) * plotHeight;

  if (interaction) {
    interaction.model = {
      points,
      width,
      height,
      pad,
      plotWidth,
      domainStart,
      timeSpanSeconds,
      x,
      y,
    };
  }

  const temperaturePath = points
    .map((point, index) => `${index ? "L" : "M"}${x(point.receivedAt).toFixed(2)},${y(Number(point.refrigeratorValue)).toFixed(2)}`)
    .join(" ");
  const targetPath = points
    .map((point, index) => `${index ? "L" : "M"}${x(point.receivedAt).toFixed(2)},${y(Number(point.setpoint)).toFixed(2)}`)
    .join(" ");

  temperaturePathElement.setAttribute("d", temperaturePath);
  targetPathElement.setAttribute("d", targetPath);

  for (let index = 0; index <= 4; index += 1) {
    const ratio = index / 4;
    const gridY = pad.top + ratio * plotHeight;
    const value = maximum - ratio * (maximum - minimum);
    addSvgLine(grid, pad.left, gridY, width - pad.right, gridY, "chart-grid-line");
    addSvgText(labels, 2, gridY + 4, `${value.toFixed(1)}°`, "chart-grid-text");
  }

  const timeTicks = [domainStart, domainStart + timeSpanSeconds / 2, domainEnd];
  for (const [index, timestamp] of timeTicks.entries()) {
    addSvgText(
      labels,
      x(timestamp),
      height - 8,
      formatTemperatureAxisTime(timestamp, timeSpanSeconds),
      "chart-grid-text",
      index === 0 ? "start" : index === timeTicks.length - 1 ? "end" : "middle",
    );
  }
}

function formatTemperatureAxisTime(epochSeconds, spanSeconds) {
  const date = new Date(Number(epochSeconds) * 1000);
  if (Number.isNaN(date.getTime())) return "—";
  const options = spanSeconds <= 120
    ? { hour: "2-digit", minute: "2-digit", second: "2-digit" }
    : spanSeconds <= 86_400
      ? { hour: "2-digit", minute: "2-digit" }
      : { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" };
  return new Intl.DateTimeFormat("pt-BR", options).format(date);
}

function renderGravityChart(fermentation) {
  const readings = Array.isArray(fermentation?.readings) ? fermentation.readings : [];
  const originalGravity = Number(fermentation?.originalGravity);
  const points = [
    { gravity: originalGravity, measuredAt: Number(fermentation?.startedAt), label: "OG" },
    ...readings.map((reading) => ({
      gravity: Number(reading.gravity),
      measuredAt: Number(reading.measuredAt),
      label: reading.note || "Leitura manual",
    })),
  ].filter((point) => Number.isFinite(point.gravity) && Number.isFinite(point.measuredAt))
    .sort((a, b) => a.measuredAt - b.measuredAt);

  elements.gravityChartGrid.replaceChildren();
  elements.gravityChartLabels.replaceChildren();
  elements.gravityPoints.replaceChildren();
  elements.gravityPath.setAttribute("d", "");
  elements.gravityOgPath.setAttribute("d", "");
  elements.gravityChartEmpty.hidden = readings.length > 0;
  if (!points.length) return;

  const width = 900;
  const height = 320;
  const pad = { left: 62, right: 18, top: 18, bottom: 42 };
  const values = points.map((point) => point.gravity);
  const rawMinimum = Math.min(...values);
  const rawMaximum = Math.max(...values);
  const valueSpan = Math.max(rawMaximum - rawMinimum, 0.010);
  let minimum = Math.floor((rawMinimum - valueSpan * 0.25) * 1000) / 1000;
  let maximum = Math.ceil((rawMaximum + valueSpan * 0.25) * 1000) / 1000;
  if (maximum - minimum < 0.010) {
    const center = (maximum + minimum) / 2;
    minimum = Math.floor((center - 0.005) * 1000) / 1000;
    maximum = Math.ceil((center + 0.005) * 1000) / 1000;
  }

  const firstTime = points[0].measuredAt;
  const lastTime = points.at(-1).measuredAt;
  const timeSpan = Math.max(lastTime - firstTime, 3600);
  const plotWidth = width - pad.left - pad.right;
  const plotHeight = height - pad.top - pad.bottom;
  const x = (timestamp) => pad.left + ((timestamp - firstTime) / timeSpan) * plotWidth;
  const y = (value) => pad.top + ((maximum - value) / (maximum - minimum)) * plotHeight;

  elements.gravityOgPath.setAttribute(
    "d",
    `M${pad.left},${y(originalGravity).toFixed(2)} L${width - pad.right},${y(originalGravity).toFixed(2)}`,
  );
  elements.gravityPath.setAttribute(
    "d",
    points.map((point, index) => `${index ? "L" : "M"}${x(point.measuredAt).toFixed(2)},${y(point.gravity).toFixed(2)}`).join(" "),
  );

  for (const point of points) {
    const circle = document.createElementNS(SVG_NS, "circle");
    circle.setAttribute("cx", x(point.measuredAt).toFixed(2));
    circle.setAttribute("cy", y(point.gravity).toFixed(2));
    circle.setAttribute("r", "5");
    circle.setAttribute("class", "gravity-point");
    const title = document.createElementNS(SVG_NS, "title");
    title.textContent = `${formatGravity(point.gravity)} · ${formatDateTime(point.measuredAt)} · ${point.label}`;
    circle.append(title);
    elements.gravityPoints.append(circle);
  }

  for (let index = 0; index <= 4; index += 1) {
    const ratio = index / 4;
    const gridY = pad.top + ratio * plotHeight;
    const value = maximum - ratio * (maximum - minimum);
    addSvgLine(elements.gravityChartGrid, pad.left, gridY, width - pad.right, gridY, "chart-grid-line");
    addSvgText(elements.gravityChartLabels, 2, gridY + 4, value.toFixed(3), "chart-grid-text");
  }

  const labelIndexes = [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])];
  for (const index of labelIndexes) {
    addSvgText(
      elements.gravityChartLabels,
      x(points[index].measuredAt),
      height - 9,
      formatGravityAxisTime(points[index].measuredAt, timeSpan),
      "chart-grid-text",
      index === 0 ? "start" : index === points.length - 1 ? "end" : "middle",
    );
  }
}

function formatGravityAxisTime(epochSeconds, spanSeconds) {
  const date = new Date(Number(epochSeconds) * 1000);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(
    "pt-BR",
    spanSeconds > 86_400
      ? { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }
      : { hour: "2-digit", minute: "2-digit" },
  ).format(date);
}

function exportHistoryCsv() {
  const points = [...state.history].reverse();
  if (!points.length) {
    showToast("Não há leituras no período selecionado para exportar.");
    return;
  }
  const cell = (value) => {
    const text = value === null || value === undefined ? "" : String(value);
    return /[;"\n]/u.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };
  const rows = [[
    "data_hora", "geladeira_c", "poco_termico_c", "setpoint_c", "estado",
    "resfriamento", "aquecimento", "alarmes", "rssi_dbm",
  ]];
  for (const point of points) {
    const date = new Date(Number(point.receivedAt) * 1000);
    rows.push([
      Number.isNaN(date.getTime()) ? "" : date.toISOString(),
      point.refrigeratorValue, point.thermalWellValue, point.setpoint,
      point.controlState, Number(point.cooling) ? "ON" : "OFF",
      Number(point.heating) ? "ON" : "OFF", Number(point.alarmsActive) ? "ATIVO" : "NORMAL",
      point.rssi,
    ]);
  }
  const csv = `\ufeff${rows.map((row) => row.map(cell).join(";")).join("\r\n")}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `maltworks-historico-${state.selectedDeviceId || "controlador"}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast("Histórico exportado em CSV.");
}

function renderLoadingDevice() {
  state.firmwareStatus = null;
  renderFirmwareStatus();
  elements.deviceName.textContent = "Carregando…";
  elements.deviceMeta.textContent = "—";
  elements.lastUpdate.textContent = "—";
  setStatusPill(elements.deviceStatus, "neutral", "AGUARDANDO");
  renderProfileProgress();
  renderChart();
  renderFermentation();
  renderRemoteControl();
  renderProfileControls();
  renderRecipes();
  renderConfigurationForms();
  renderCalibration();
  renderAlarmSettings();
  renderDeviceDetails();
}

function renderNoDevices() {
  state.latest = null;
  state.firmwareStatus = null;
  renderFirmwareStatus();
  state.history = [];
  resetChartViewport();
  state.fermentation = null;
  state.fermentationError = null;
  state.batches = [];
  state.selectedBatchId = null;
  state.batchFormId = null;
  state.showNewFermentationForm = false;
  document.querySelector("main.dashboard")?.classList.add("no-devices");
  elements.emptyDeviceView.hidden = false;
  elements.deviceName.textContent = "Nenhum controlador";
  elements.deviceMeta.textContent = "Vincule um dispositivo à sua organização para começar.";
  setStatusPill(elements.deviceStatus, "neutral", "SEM DISPOSITIVOS");
  setGlobalStatus("neutral", "SEM DISPOSITIVOS");
  renderProfileProgress();
  renderChart();
  renderFermentation();
  renderRemoteControl();
  renderProfileControls();
  renderRecipes();
  renderConfigurationForms();
  renderCalibration();
  renderAlarmSettings();
  renderDeviceDetails();
}

function startTimers() {
  clearTimers();
  state.uiTimer = window.setInterval(updateTimeSensitiveUi, 1_000);
  state.refreshTimer = window.setInterval(() => {
    const realtimeFresh = state.realtimeSocket?.readyState === WebSocket.OPEN &&
      Date.now() - state.realtimeLastMessageAt < 15_000;
    if (!realtimeFresh) void refreshLatest();
  }, 2_000);
  scheduleHistoryRefresh();
  state.supportingTimer = window.setInterval(() => void refreshSupportingData(), 30_000);
  state.notificationTimer = window.setInterval(() => {
    if (!document.hidden && state.realtimeSocket?.readyState !== WebSocket.OPEN) {
      void loadNotifications().catch(handleRefreshError);
    }
  }, 5_000);
}

function scheduleHistoryRefresh() {
  if (state.historyTimer) window.clearInterval(state.historyTimer);
  state.historyTimer = null;
  if (state.chartPaused) return;
  const rangeSeconds = state.historyRange === "all" ? Number.POSITIVE_INFINITY : Number(state.historyRange);
  const interval = rangeSeconds <= 60 ? 5_000 : rangeSeconds <= 300 ? 10_000 : 30_000;
  state.historyTimer = window.setInterval(() => void refreshHistory(), interval);
}

function clearTimers() {
  if (state.uiTimer) window.clearInterval(state.uiTimer);
  if (state.refreshTimer) window.clearInterval(state.refreshTimer);
  if (state.historyTimer) window.clearInterval(state.historyTimer);
  if (state.supportingTimer) window.clearInterval(state.supportingTimer);
  if (state.notificationTimer) window.clearInterval(state.notificationTimer);
  state.uiTimer = null;
  state.refreshTimer = null;
  state.historyTimer = null;
  state.supportingTimer = null;
  state.notificationTimer = null;
}

function connectRealtime() {
  if (!state.user || state.realtimeSocket?.readyState === WebSocket.OPEN ||
      state.realtimeSocket?.readyState === WebSocket.CONNECTING) return;
  if (state.realtimeReconnectTimer) {
    window.clearTimeout(state.realtimeReconnectTimer);
    state.realtimeReconnectTimer = null;
  }

  state.realtimeManualClose = false;
  const organizationId = state.user.memberships?.[0]?.organizationId;
  const suffix = organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : "";
  const socket = new WebSocket(`${REALTIME_BASE}/v1/realtime${suffix}`);
  state.realtimeSocket = socket;

  socket.addEventListener("open", () => {
    state.realtimeReconnectAttempt = 0;
    state.realtimeLastMessageAt = Date.now();
    void Promise.all([loadDevices(), loadNotifications()]).catch(handleRefreshError);
    if (state.selectedDeviceId) void loadLatest().catch(handleRefreshError);
  });
  socket.addEventListener("message", (event) => {
    state.realtimeLastMessageAt = Date.now();
    handleRealtimeEvent(event.data);
  });
  socket.addEventListener("close", () => {
    if (state.realtimeSocket === socket) state.realtimeSocket = null;
    if (!state.realtimeManualClose && state.user) scheduleRealtimeReconnect();
  });
  socket.addEventListener("error", () => socket.close());
}

function disconnectRealtime() {
  state.realtimeManualClose = true;
  if (state.realtimeReconnectTimer) window.clearTimeout(state.realtimeReconnectTimer);
  state.realtimeReconnectTimer = null;
  const socket = state.realtimeSocket;
  state.realtimeSocket = null;
  if (socket && socket.readyState < WebSocket.CLOSING) socket.close(1000, "Sessao encerrada");
}

function scheduleRealtimeReconnect() {
  if (state.realtimeReconnectTimer || !state.user) return;
  const delay = Math.min(30_000, 1_000 * (2 ** state.realtimeReconnectAttempt));
  state.realtimeReconnectAttempt = Math.min(state.realtimeReconnectAttempt + 1, 5);
  state.realtimeReconnectTimer = window.setTimeout(() => {
    state.realtimeReconnectTimer = null;
    connectRealtime();
  }, delay);
}

function handleRealtimeEvent(raw) {
  let event;
  try {
    event = JSON.parse(raw);
  } catch {
    return;
  }
  if (!event || typeof event !== "object") return;

  if (event.type === "telemetry" && event.deviceId && event.state) {
    state.devicePresence[event.deviceId] = {
      status: "online",
      lastSeenAt: Number(event.receivedAt) || Math.floor(Date.now() / 1_000),
    };
    const device = state.devices.find((item) => item.id === event.deviceId);
    if (device) {
      device.stateReceivedAt = event.receivedAt;
      device.lastSeenAt = event.receivedAt;
    }
    renderDeviceList();

    if (event.deviceId === state.selectedDeviceId) {
      const previousCommand = state.latest?.latestCommand;
      state.latest = {
        ...(state.latest || {}),
        ok: true,
        deviceId: event.deviceId,
        receivedAt: Number(event.receivedAt),
        state: event.state,
      };
      appendRealtimeHistory(event.state, Number(event.receivedAt));
      renderLatest();
      announceCommandTransition(previousCommand, state.latest.latestCommand);
      if (event.state.commandResult) void loadLatest().catch(handleRefreshError);
    }
    return;
  }

  if (event.type === "presence" && event.deviceId) {
    state.devicePresence[event.deviceId] = {
      status: event.status === "offline" ? "offline" : "online",
      lastSeenAt: Number(event.lastSeenAt) || Math.floor(Date.now() / 1_000),
    };
    renderDeviceList();
    if (event.deviceId === state.selectedDeviceId && state.latest) renderLatest();
    return;
  }

  if (event.type === "notifications_changed") {
    void loadNotifications().catch(handleRefreshError);
    return;
  }

  if (event.type === "command_changed" && event.deviceId === state.selectedDeviceId) {
    void loadLatest().catch(handleRefreshError);
  }
}

function appendRealtimeHistory(data, receivedAt) {
  if (state.chartPaused || !Number.isFinite(receivedAt)) return;
  const point = {
    receivedAt,
    refrigeratorValue: data.temperatures?.refrigerator?.value ?? null,
    thermalWellValue: data.temperatures?.thermalWell?.value ?? null,
    setpoint: data.control?.setpoint ?? null,
    controlState: data.control?.state ?? "",
    cooling: data.control?.cooling ? 1 : 0,
    heating: data.control?.heating ? 1 : 0,
    alarmsActive: data.alarms?.active ? 1 : 0,
    rssi: data.network?.rssi ?? null,
  };
  state.history = [point, ...state.history.filter((item) => Number(item.receivedAt) !== receivedAt)]
    .slice(0, 720);
  renderChart();
}

async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const request = {
    method: options.method || "GET",
    credentials: "include",
    cache: "no-store",
    headers,
  };

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
    request.body = JSON.stringify(options.body);
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, request);
  } catch {
    throw new AppError(0, "NETWORK_ERROR", "Não foi possível alcançar o Maltworks Cloud.");
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // Respostas sem JSON são tratadas pelo status HTTP abaixo.
  }

  if (!response.ok) {
    throw new AppError(
      response.status,
      payload?.error?.code || "REQUEST_FAILED",
      payload?.error?.message || `Falha na requisição (HTTP ${response.status}).`,
    );
  }

  return payload;
}

async function apiFile(path, options = {}) {
  const headers = new Headers(options.headers || {});
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: options.method || "GET",
      credentials: "include",
      cache: "no-store",
      headers,
      body: options.body,
    });
  } catch {
    throw new AppError(0, "NETWORK_ERROR", "Não foi possível alcançar o Maltworks Cloud.");
  }

  const contentType = response.headers.get("Content-Type") || "";
  if (!response.ok) {
    let payload = null;
    if (contentType.includes("application/json")) {
      try { payload = await response.json(); } catch { /* Corpo inválido. */ }
    }
    throw new AppError(
      response.status,
      payload?.error?.code || "REQUEST_FAILED",
      payload?.error?.message || `Falha na requisição (HTTP ${response.status}).`,
    );
  }
  return contentType.includes("application/json") ? response.json() : response.blob();
}

class AppError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
  }
}

function isAuthenticationError(error) {
  return error instanceof AppError && (error.status === 401 || error.code === "SESSION_EXPIRED");
}

function humanError(error, fallback) {
  if (error instanceof AppError) return error.message;
  return fallback;
}

function setLoginBusy(busy) {
  elements.loginButton.disabled = busy;
  elements.loginButton.firstElementChild.textContent = busy ? "ENTRANDO…" : "ENTRAR NO PAINEL";
}

function setLoginError(message) {
  elements.loginError.textContent = message;
  elements.loginError.hidden = !message;
}

function setContactBusy(busy) {
  elements.contactSubmitButton.disabled = busy;
  elements.contactSubmitButton.firstElementChild.textContent = busy
    ? "ENVIANDO…"
    : "SOLICITAR CONTATO";
}

function setContactError(message) {
  elements.contactError.textContent = message;
  elements.contactError.hidden = !message;
}

function setSignupBusy(busy) {
  elements.signupButton.disabled = busy;
  elements.signupButton.firstElementChild.textContent = busy
    ? "CRIANDO CONTA…"
    : "CRIAR MINHA CONTA";
}

function setSignupError(message) {
  elements.signupError.textContent = message;
  elements.signupError.hidden = !message;
}

function setClaimBusy(busy) {
  elements.claimSubmitButton.disabled = busy;
  elements.claimSubmitButton.firstElementChild.textContent = busy
    ? "CADASTRANDO…"
    : "CADASTRAR CONTROLADOR";
}

function setClaimError(message) {
  elements.claimError.textContent = message;
  elements.claimError.hidden = !message;
}

function setEditDeviceBusy(busy) {
  elements.saveEditDeviceButton.disabled = busy;
  elements.cancelEditDeviceButton.disabled = busy;
  elements.closeEditDeviceButton.disabled = busy;
  elements.saveEditDeviceButton.firstElementChild.textContent = busy
    ? "SALVANDO…"
    : "SALVAR ALTERAÇÕES";
}

function setEditDeviceError(message) {
  elements.editDeviceError.textContent = message;
  elements.editDeviceError.hidden = !message;
}

function setDeleteDeviceBusy(busy) {
  elements.deleteDeviceSubmitButton.disabled = busy;
  elements.cancelDeleteDeviceButton.disabled = busy;
  elements.closeDeleteDeviceButton.disabled = busy;
  elements.deleteDeviceSubmitButton.firstElementChild.textContent = busy
    ? "EXCLUINDO…"
    : "EXCLUIR DEFINITIVAMENTE";
}

function setDeleteDeviceError(message) {
  elements.deleteDeviceError.textContent = message;
  elements.deleteDeviceError.hidden = !message;
}

function formatRegistrationToken(value) {
  const compact = String(value).replace(/[^a-z0-9]/giu, "").toUpperCase().slice(0, 30);
  if (!compact) return "";
  if (compact.length <= 2 && "MW".startsWith(compact)) return compact;
  const payload = compact.startsWith("MW") ? compact.slice(2) : compact;
  const deviceId = payload.slice(0, 12);
  const proof = payload.slice(12, 28);
  const groups = proof.match(/.{1,4}/gu) || [];
  return `MW${deviceId ? `-${deviceId}` : ""}${groups.length ? `-${groups.join("-")}` : ""}`;
}

function formatRegistrationTokenInput(event) {
  event.currentTarget.value = formatRegistrationToken(event.currentTarget.value);
}

function togglePasswordVisibility() {
  const visible = elements.password.type === "text";
  elements.password.type = visible ? "password" : "text";
  elements.togglePassword.setAttribute("aria-label", visible ? "Mostrar senha" : "Ocultar senha");
}

function restoreEmail() {
  const email = readLocalPreference("mw_last_email");
  if (email) elements.email.value = email;
}

function readLocalPreference(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocalPreference(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Preferências locais são opcionais e nunca devem bloquear o painel.
  }
}

function removeLocalPreference(key) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Preferências locais são opcionais e nunca devem bloquear o painel.
  }
}

function setGlobalStatus(kind, label) {
  setStatusPill(elements.globalStatus, kind, label);
}

function setStatusPill(element, kind, label) {
  element.classList.remove("online", "unstable", "offline", "neutral");
  element.classList.add(kind);
  const labelElement = element.querySelector("span");
  if (labelElement) labelElement.textContent = label;
}

function connectionStatus(epochSeconds, deviceId = state.selectedDeviceId) {
  const presence = deviceId ? state.devicePresence[deviceId] : null;
  if (presence?.status === "offline") return "offline";
  const epoch = Math.max(Number(epochSeconds) || 0, Number(presence?.lastSeenAt) || 0);
  if (!Number.isFinite(epoch) || epoch <= 0) return "offline";
  const age = Date.now() / 1_000 - epoch;
  if (age < 15) return "online";
  if (age < 30) return "unstable";
  return "offline";
}

function isOnline(epochSeconds, deviceId = state.selectedDeviceId) {
  return connectionStatus(epochSeconds, deviceId) !== "offline";
}

function renderConnectionStatus(connection) {
  if (connection === "online") {
    setStatusPill(elements.deviceStatus, "online", "ONLINE");
    setGlobalStatus("online", "SISTEMA ONLINE");
  } else if (connection === "unstable") {
    setStatusPill(elements.deviceStatus, "unstable", "INSTÁVEL");
    setGlobalStatus("unstable", "COMUNICAÇÃO INSTÁVEL");
  } else {
    setStatusPill(elements.deviceStatus, "offline", "OFFLINE");
    setGlobalStatus("offline", "CONTROLADOR OFFLINE");
  }
}

function formatNumber(value, digits) {
  const number = Number(value);
  return Number.isFinite(number)
    ? number.toLocaleString("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits })
    : "—";
}

function formatDateTime(epochSeconds) {
  const date = new Date(Number(epochSeconds) * 1000);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit",
    }).format(date);
}

function formatTime(epochSeconds) {
  const date = new Date(Number(epochSeconds) * 1000);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(date);
}

function timeAgo(epochSeconds) {
  const difference = Math.max(0, Math.floor(Date.now() / 1000 - Number(epochSeconds)));
  if (!Number.isFinite(difference)) return "—";
  if (difference < 5) return "agora";
  if (difference < 60) return `há ${difference} s`;
  if (difference < 3600) return `há ${Math.floor(difference / 60)} min`;
  return `há ${Math.floor(difference / 3600)} h`;
}

function formatDuration(secondsValue) {
  const seconds = Math.max(0, Number(secondsValue || 0));
  if (!Number.isFinite(seconds) || seconds === 0) return "—";
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days) return `${days} d ${hours} h`;
  if (hours) return `${hours} h ${minutes} min`;
  return `${minutes} min`;
}

function signalDetails(rssi) {
  if (!Number.isFinite(rssi)) return { percent: 0, label: "Sem leitura", color: "#71675c" };
  const percent = Math.max(5, Math.min(100, (rssi + 100) * 2));
  if (rssi >= -60) return { percent, label: "Sinal excelente", color: "#61b985" };
  if (rssi >= -70) return { percent, label: "Sinal bom", color: "#c89435" };
  if (rssi >= -80) return { percent, label: "Sinal regular", color: "#d28b4d" };
  return { percent, label: "Sinal fraco", color: "#db705f" };
}

function addSvgLine(parent, x1, y1, x2, y2, className) {
  const line = document.createElementNS(SVG_NS, "line");
  line.setAttribute("x1", String(x1));
  line.setAttribute("y1", String(y1));
  line.setAttribute("x2", String(x2));
  line.setAttribute("y2", String(y2));
  line.setAttribute("class", className);
  parent.append(line);
}

function addSvgText(parent, x, y, text, className, anchor = "start") {
  const label = document.createElementNS(SVG_NS, "text");
  label.setAttribute("x", String(x));
  label.setAttribute("y", String(y));
  label.setAttribute("class", className);
  label.setAttribute("text-anchor", anchor);
  label.textContent = text;
  parent.append(label);
}

let toastTimer = null;
function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  if (toastTimer) window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => elements.toast.classList.remove("show"), 3200);
}
