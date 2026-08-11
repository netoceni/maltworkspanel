"use strict";

const API_BASE = ["localhost", "127.0.0.1"].includes(window.location.hostname)
  ? "http://127.0.0.1:8787"
  : "https://api.maltworks.com.br";
const SVG_NS = "http://www.w3.org/2000/svg";

const state = {
  user: null,
  devices: [],
  selectedDeviceId: null,
  latest: null,
  history: [],
  recipes: [],
  fermentation: null,
  fermentationError: null,
  fermentationBusy: false,
  showNewFermentationForm: false,
  historyLimit: 240,
  uiTimer: null,
  refreshTimer: null,
  historyTimer: null,
  busy: false,
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
};

const elements = {};

document.addEventListener("DOMContentLoaded", () => {
  // A navegação é inicializada primeiro e de forma independente. Assim, uma
  // falha posterior de API ou um HTML parcialmente atualizado não bloqueia as abas.
  initializeTabNavigation();
  cacheElements();
  bindEvents();
  restoreEmail();
  selectTab(readLocalPreference("mw_active_tab") || "dashboard");
  void restoreSession();
});

function cacheElements() {
  for (const id of [
    "loginView", "appView", "loginForm", "email", "password", "togglePassword",
    "loginError", "loginButton", "logoutButton", "refreshButton", "globalStatus",
    "signupForm", "signupName", "signupBirthDate", "signupPhone", "signupEmail",
    "signupPassword", "signupPasswordConfirm", "signupTerms", "signupError",
    "signupButton", "showSignupButton", "showLoginButton",
    "contactDialog", "closeContactButton", "contactForm",
    "contactName", "contactEmail", "contactPhone", "contactWebsite", "contactConsent",
    "contactError", "contactSubmitButton", "contactSuccess", "contactSuccessCloseButton",
    "claimLoginHint", "openClaimButton", "claimDialog", "closeClaimButton", "claimForm",
    "claimRegistrationToken", "claimDeviceName", "claimError",
    "claimSubmitButton", "claimSuccess", "claimSuccessCloseButton",
    "userName", "organizationName", "deviceCount", "deviceList", "deviceName",
    "emptyDeviceView", "emptyClaimButton",
    "deviceStatus", "deviceMeta", "lastUpdate", "refrigeratorTemperature",
    "setpointValue", "hysteresisValue", "thermalWellTemperature", "thermalWellStatus",
    "controlState", "coolingRelay", "heatingRelay", "rssiValue", "signalMeter",
    "signalQuality", "temperatureChart", "chartGrid", "chartLabels", "targetPath",
    "temperaturePath", "chartEmpty", "profileBadge", "profileName", "profileStages",
    "profileRemaining", "compressorProtection", "alarmCard", "alarmBadge", "alarmSymbol",
    "alarmTitle", "alarmText", "firmwareBadge", "systemDeviceId", "bootId", "uptime",
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
    "dashboardTemperatureChart", "dashboardChartGrid", "dashboardChartLabels",
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
  elements.logoutButton.addEventListener("click", handleLogout);
  elements.refreshButton.addEventListener("click", () => void refreshAll(true));
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

  elements.configurationForm.addEventListener("input", () => { state.configurationDirty = true; });
  elements.calibrationForm.addEventListener("input", () => { state.calibrationDirty = true; });
  elements.alarmSettingsForm.addEventListener("input", () => { state.alarmsDirty = true; });

  document.querySelectorAll("[data-limit]").forEach((button) => {
    button.addEventListener("click", () => {
      state.historyLimit = Number(button.dataset.limit);
      document.querySelectorAll("[data-limit]").forEach((item) => {
        item.classList.toggle("active", item === button);
      });
      void loadHistory(true);
    });
  });

  window.addEventListener("focus", () => {
    if (!elements.appView.hidden) void refreshAll(false);
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
  try {
    const response = await api("/v1/me");
    state.user = response.user;
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
  try {
    await api("/v1/auth/logout", { method: "POST" });
  } catch {
    // A interface local deve encerrar a sessão mesmo se a rede cair.
  }
  clearTimers();
  state.user = null;
  state.devices = [];
  state.recipes = [];
  state.fermentation = null;
  state.fermentationError = null;
  state.latest = null;
  showLogin();
  showToast("Sessão encerrada.");
}

async function enterDashboard() {
  elements.loginView.hidden = true;
  elements.appView.hidden = false;
  renderUser();
  await Promise.all([loadDevices(), loadRecipes()]);
  if (state.selectedDeviceId) {
    await Promise.all([loadLatest(), loadHistory(false), loadFermentation()]);
  }
  selectTab(state.activeTab);
  startTimers();
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
    await Promise.all([loadLatest(), loadHistory(false), loadFermentation()]);
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
  clearTimers();
  elements.appView.hidden = true;
  elements.loginView.hidden = false;
  elements.signupForm.hidden = true;
  elements.loginForm.hidden = false;
  window.setTimeout(() => elements.email.focus(), 0);
}

function showSignup() {
  setLoginError("");
  setSignupError("");
  elements.loginForm.hidden = true;
  elements.signupForm.hidden = false;
  if (!elements.signupEmail.value) elements.signupEmail.value = elements.email.value.trim();
  window.setTimeout(() => elements.signupName.focus(), 0);
}

async function loadDevices() {
  const response = await api("/v1/devices");
  state.devices = Array.isArray(response.devices) ? response.devices : [];

  const savedDevice = readLocalPreference("mw_selected_device");
  if (!state.selectedDeviceId || !state.devices.some((device) => device.id === state.selectedDeviceId)) {
    state.selectedDeviceId = state.devices.some((device) => device.id === savedDevice)
      ? savedDevice
      : state.devices[0]?.id ?? null;
  }

  renderDeviceList();
  if (!state.selectedDeviceId) {
    renderNoDevices();
  } else {
    document.querySelector("main.dashboard")?.classList.remove("no-devices");
    elements.emptyDeviceView.hidden = true;
  }
}

async function refreshAll(showConfirmation) {
  if (state.busy || !state.selectedDeviceId) return;
  state.busy = true;
  elements.refreshButton.classList.add("loading");

  try {
    await Promise.all([loadDevices(), loadRecipes()]);
    if (!state.selectedDeviceId) return;
    await Promise.all([loadLatest(), loadHistory(false), loadFermentation()]);
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
    await Promise.all([loadHistory(false), loadFermentation()]);
  } catch (error) {
    handleRefreshError(error);
  } finally {
    state.supportingBusy = false;
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

async function loadHistory(showConfirmation) {
  if (!state.selectedDeviceId) return;
  const response = await api(
    `/v1/devices/${encodeURIComponent(state.selectedDeviceId)}/telemetry?limit=${state.historyLimit}`,
  );
  state.history = Array.isArray(response.points) ? response.points : [];
  renderChart();
  if (showConfirmation) showToast("Período do gráfico atualizado.");
}

async function loadRecipes() {
  const response = await api("/v1/recipes");
  state.recipes = Array.isArray(response.recipes) ? response.recipes : [];
  renderRecipes();
  renderProfileProgress();
}

async function loadFermentation() {
  if (!state.selectedDeviceId) {
    state.fermentation = null;
    state.fermentationError = null;
    renderFermentation();
    return;
  }
  try {
    const response = await api(
      `/v1/devices/${encodeURIComponent(state.selectedDeviceId)}/fermentation`,
    );
    state.fermentation = response.fermentation || null;
    state.fermentationError = null;
    renderFermentation();
  } catch (error) {
    if (isAuthenticationError(error)) throw error;
    state.fermentation = null;
    state.fermentationError = error;
    renderFermentation();
  }
}

function renderUser() {
  elements.userName.textContent = state.user?.displayName || state.user?.email || "Usuário";
  elements.organizationName.textContent = state.user?.memberships?.[0]?.organizationName || "Maltworks";
}

function renderDeviceList() {
  elements.deviceCount.textContent = String(state.devices.length);
  elements.deviceList.replaceChildren();

  for (const device of state.devices) {
    const online = isOnline(device.stateReceivedAt || device.lastSeenAt);
    const button = document.createElement("button");
    button.type = "button";
    button.className = `device-item${device.id === state.selectedDeviceId ? " active" : ""}`;
    button.setAttribute("aria-current", device.id === state.selectedDeviceId ? "true" : "false");

    const symbol = document.createElement("span");
    symbol.className = "device-symbol";
    symbol.textContent = "°";

    const copy = document.createElement("span");
    const name = document.createElement("b");
    name.textContent = device.name;
    const status = document.createElement("small");
    status.textContent = online ? "Online agora" : "Sem comunicação";
    copy.append(name, status);

    const dot = document.createElement("i");
    dot.className = `device-dot ${online ? "online" : "offline"}`;

    button.append(symbol, copy, dot);
    button.addEventListener("click", () => void selectDevice(device.id));
    elements.deviceList.append(button);
  }
}

async function selectDevice(deviceId) {
  if (deviceId === state.selectedDeviceId) return;
  state.selectedDeviceId = deviceId;
  writeLocalPreference("mw_selected_device", deviceId);
  renderDeviceList();
  state.latest = null;
  state.history = [];
  state.fermentation = null;
  state.fermentationError = null;
  state.showNewFermentationForm = false;
  state.formDeviceId = null;
  state.configurationDirty = false;
  state.calibrationDirty = false;
  state.alarmsDirty = false;
  state.pendingConfigurationCommandId = null;
  state.pendingConfigurationScope = null;
  renderLoadingDevice();
  await refreshAll(false);
}

function renderLatest() {
  const snapshot = state.latest;
  const data = snapshot?.state;
  if (!data) return;

  const device = state.devices.find((item) => item.id === state.selectedDeviceId);
  const online = isOnline(snapshot.receivedAt);

  elements.deviceName.textContent = device?.name || data.deviceId;
  setStatusPill(elements.deviceStatus, online ? "online" : "offline", online ? "ONLINE" : "OFFLINE");
  setGlobalStatus(online ? "online" : "offline", online ? "SISTEMA ONLINE" : "CONTROLADOR OFFLINE");
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
  const showStart = !fermentation || state.showNewFermentationForm;
  elements.fermentationStartView.hidden = !showStart;
  elements.fermentationTrackingView.hidden = showStart;

  if (showStart) {
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
  const attenuation = Number.isFinite(currentGravity) && originalGravity > 1
    ? Math.max(0, ((originalGravity - currentGravity) / (originalGravity - 1)) * 100)
    : null;
  const estimatedAbv = Number.isFinite(currentGravity)
    ? Math.max(0, (originalGravity - currentGravity) * 131.25)
    : null;

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
  elements.newFermentationButton.disabled = viewer || state.fermentationBusy;
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
      { method: "POST", body: { name, originalGravity, startedAt } },
    );
    state.fermentation = response.fermentation;
    state.fermentationError = null;
    state.showNewFermentationForm = false;
    elements.fermentationStartForm.reset();
    setDefaultDateTime(elements.fermentationStartedAtInput, null, true);
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
    const response = await api(
      `/v1/devices/${encodeURIComponent(state.selectedDeviceId)}/fermentation/readings`,
      {
        method: "POST",
        body: { gravity, measuredAt, note: elements.gravityNoteInput.value.trim() },
      },
    );
    state.fermentation = response.fermentation;
    state.fermentationError = null;
    elements.gravityReadingInput.value = "";
    elements.gravityNoteInput.value = "";
    setDefaultDateTime(elements.gravityMeasuredAtInput, null, true);
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
    const response = await api(
      `/v1/devices/${encodeURIComponent(state.selectedDeviceId)}/fermentation/readings/${encodeURIComponent(reading.id)}`,
      { method: "DELETE" },
    );
    state.fermentation = response.fermentation;
    state.fermentationError = null;
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
    const response = await api(
      `/v1/devices/${encodeURIComponent(state.selectedDeviceId)}/fermentation/finish`,
      { method: "POST", body: {} },
    );
    state.fermentation = response.fermentation;
    state.fermentationError = null;
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

  const receivedAt = state.latest?.receivedAt;
  if (!receivedAt) return;

  const online = isOnline(receivedAt);
  setStatusPill(elements.deviceStatus, online ? "online" : "offline", online ? "ONLINE" : "OFFLINE");
  setGlobalStatus(online ? "online" : "offline", online ? "SISTEMA ONLINE" : "CONTROLADOR OFFLINE");
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
  const points = [...state.history]
    .reverse()
    .filter((point) => Number.isFinite(Number(point.refrigeratorValue)));

  renderTemperatureChart(points, {
    grid: elements.chartGrid,
    labels: elements.chartLabels,
    temperaturePath: elements.temperaturePath,
    targetPath: elements.targetPath,
    empty: elements.chartEmpty,
    height: 300,
  });
  renderTemperatureChart(points, {
    grid: elements.dashboardChartGrid,
    labels: elements.dashboardChartLabels,
    temperaturePath: elements.dashboardTemperaturePath,
    targetPath: elements.dashboardTargetPath,
    empty: elements.dashboardChartEmpty,
    height: 260,
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
  } = graph;
  grid.replaceChildren();
  labels.replaceChildren();

  if (points.length < 2) {
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
  const x = (index) => pad.left + (index / (points.length - 1)) * plotWidth;
  const y = (value) => pad.top + ((maximum - value) / (maximum - minimum)) * plotHeight;

  const temperaturePath = points
    .map((point, index) => `${index ? "L" : "M"}${x(index).toFixed(2)},${y(Number(point.refrigeratorValue)).toFixed(2)}`)
    .join(" ");
  const targetPath = points
    .map((point, index) => `${index ? "L" : "M"}${x(index).toFixed(2)},${y(Number(point.setpoint)).toFixed(2)}`)
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

  const timeIndexes = [0, Math.floor((points.length - 1) / 2), points.length - 1];
  for (const index of timeIndexes) {
    addSvgText(
      labels,
      x(index),
      height - 8,
      formatTime(points[index].receivedAt),
      "chart-grid-text",
      index === 0 ? "start" : index === points.length - 1 ? "end" : "middle",
    );
  }
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
  state.history = [];
  state.fermentation = null;
  state.fermentationError = null;
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
  state.refreshTimer = window.setInterval(() => void refreshLatest(), 2_000);
  state.historyTimer = window.setInterval(() => void refreshSupportingData(), 30_000);
}

function clearTimers() {
  if (state.uiTimer) window.clearInterval(state.uiTimer);
  if (state.refreshTimer) window.clearInterval(state.refreshTimer);
  if (state.historyTimer) window.clearInterval(state.historyTimer);
  state.uiTimer = null;
  state.refreshTimer = null;
  state.historyTimer = null;
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

function setGlobalStatus(kind, label) {
  setStatusPill(elements.globalStatus, kind, label);
}

function setStatusPill(element, kind, label) {
  element.classList.remove("online", "offline", "neutral");
  element.classList.add(kind);
  const labelElement = element.querySelector("span");
  if (labelElement) labelElement.textContent = label;
}

function isOnline(epochSeconds) {
  const epoch = Number(epochSeconds);
  return Number.isFinite(epoch) && Date.now() / 1000 - epoch < 65;
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
