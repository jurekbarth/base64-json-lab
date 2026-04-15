const state = {
  mode: "decode",
  format: "auto",
};

const inputArea = document.querySelector("#inputArea");
const outputArea = document.querySelector("#outputArea");
const formatSelect = document.querySelector("#formatSelect");
const modeButtons = document.querySelectorAll("[data-mode]");
const modeLabel = document.querySelector("#modeLabel");
const formatLabel = document.querySelector("#formatLabel");
const statusBadge = document.querySelector("#statusBadge");
const statusMessage = document.querySelector("#statusMessage");
const statusHint = document.querySelector("#statusHint");
const statusPanel = document.querySelector(".status-panel");
const inputLabel = document.querySelector("#inputLabel");
const outputLabel = document.querySelector("#outputLabel");
const inputMeta = document.querySelector("#inputMeta");
const outputMeta = document.querySelector("#outputMeta");
const copyButton = document.querySelector("#copyButton");
const clearButton = document.querySelector("#clearButton");
const swapButton = document.querySelector("#swapButton");
const sampleTextButton = document.querySelector("#sampleTextButton");
const sampleJsonButton = document.querySelector("#sampleJsonButton");

function bytesToBase64(bytes) {
  let binary = "";
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const slice = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...slice);
  }

  return btoa(binary);
}

function textToBase64(value) {
  return bytesToBase64(new TextEncoder().encode(value));
}

function normalizeBase64(value) {
  const trimmed = value.replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");

  if (!trimmed) {
    return "";
  }

  const remainder = trimmed.length % 4;
  return remainder === 0 ? trimmed : trimmed.padEnd(trimmed.length + (4 - remainder), "=");
}

function base64ToText(value) {
  const normalized = normalizeBase64(value);
  const binary = atob(normalized);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function formatCount(label, value) {
  const count = value.length;
  const noun = count === 1 ? "character" : "characters";
  return `${count.toLocaleString()} ${noun}${label ? `, ${label}` : ""}`;
}

function updateLabels() {
  const modeText = state.mode === "decode" ? "Decode" : "Encode";
  const formatText =
    state.format === "auto"
      ? "Auto detect"
      : state.format === "json"
        ? "JSON"
        : "Text";

  modeLabel.textContent = modeText;
  formatLabel.textContent = formatText;

  if (state.mode === "decode") {
    inputLabel.textContent = "Base64 input";
    outputLabel.textContent = "Decoded output";
    inputArea.placeholder = "Paste Base64 here to decode it.";
    outputArea.placeholder = "The decoded result will appear here.";
  } else {
    inputLabel.textContent = state.format === "json" ? "JSON input" : "Text or JSON input";
    outputLabel.textContent = "Base64 output";
    inputArea.placeholder =
      state.format === "json"
        ? '{\n  "message": "Paste JSON here to encode it."\n}'
        : "Paste plain text or JSON here to encode it.";
    outputArea.placeholder = "The Base64 result will appear here.";
  }
}

function setStatus(kind, message, hint) {
  statusPanel.classList.remove("is-error", "is-success");

  if (kind === "error") {
    statusPanel.classList.add("is-error");
    statusBadge.textContent = "Error";
  } else if (kind === "success") {
    statusPanel.classList.add("is-success");
    statusBadge.textContent = "Success";
  } else {
    statusBadge.textContent = "Ready";
  }

  statusMessage.textContent = message;
  statusHint.textContent = hint;
}

function parseJson(text) {
  return JSON.parse(text);
}

function tryParseJson(text) {
  try {
    return { ok: true, value: parseJson(text) };
  } catch (error) {
    return { ok: false, error };
  }
}

function decodeValue(value) {
  const text = base64ToText(value);

  if (state.format === "text") {
    return {
      output: text,
      detail: "Decoded as plain text.",
      typeLabel: "text",
    };
  }

  if (state.format === "json") {
    const parsed = parseJson(text);
    return {
      output: JSON.stringify(parsed, null, 2),
      detail: "Decoded and parsed as JSON.",
      typeLabel: "JSON",
    };
  }

  const parsed = tryParseJson(text);
  if (parsed.ok) {
    return {
      output: JSON.stringify(parsed.value, null, 2),
      detail: "Decoded and auto-detected JSON.",
      typeLabel: "JSON",
    };
  }

  return {
    output: text,
    detail: "Decoded as text because JSON parsing was not needed.",
    typeLabel: "text",
  };
}

function encodeValue(value) {
  if (state.format === "json") {
    parseJson(value);
    return {
      output: textToBase64(value),
      detail: "Validated JSON and encoded it to Base64.",
      typeLabel: "Base64",
    };
  }

  if (state.format === "auto") {
    const parsed = tryParseJson(value);
    return {
      output: textToBase64(value),
      detail: parsed.ok
        ? "Detected valid JSON and encoded the current text exactly as entered."
        : "Encoded plain text to Base64.",
      typeLabel: "Base64",
    };
  }

  return {
    output: textToBase64(value),
    detail: "Encoded plain text to Base64.",
    typeLabel: "Base64",
  };
}

function convert() {
  const input = inputArea.value;
  inputMeta.textContent = formatCount(null, input);

  if (!input.trim()) {
    outputArea.value = "";
    outputMeta.textContent = "0 characters";
    setStatus("idle", "Enter a value to begin.", "URL-safe Base64 and whitespace are handled automatically.");
    return;
  }

  try {
    const result = state.mode === "decode" ? decodeValue(input) : encodeValue(input);
    outputArea.value = result.output;
    outputMeta.textContent = formatCount(result.typeLabel, result.output);
    setStatus("success", result.detail, "Use Swap to flip the result back into the input panel.");
  } catch (error) {
    outputArea.value = "";
    outputMeta.textContent = "0 characters";
    setStatus(
      "error",
      error instanceof Error ? error.message : "Something went wrong during conversion.",
      state.mode === "decode"
        ? "Check that the input is valid Base64 and matches the selected format."
        : "Check that the JSON is valid before encoding."
    );
  }
}

function setMode(mode) {
  state.mode = mode;
  modeButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.mode === mode);
  });
  updateLabels();
  convert();
}

function useSample(kind) {
  if (kind === "text") {
    state.mode = "encode";
    state.format = "text";
    inputArea.value = "tado makes utilities easier to inspect.";
  } else {
    state.mode = "encode";
    state.format = "json";
    inputArea.value = JSON.stringify(
      {
        customerId: 4821,
        environment: "sandbox",
        features: ["decode", "encode", "pretty-print"],
        active: true,
      },
      null,
      2
    );
  }

  formatSelect.value = state.format;
  modeButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.mode === state.mode);
  });
  updateLabels();
  convert();
}

modeButtons.forEach((button) => {
  button.addEventListener("click", () => setMode(button.dataset.mode));
});

formatSelect.addEventListener("change", (event) => {
  state.format = event.target.value;
  updateLabels();
  convert();
});

inputArea.addEventListener("input", convert);

copyButton.addEventListener("click", async () => {
  if (!outputArea.value) {
    setStatus("idle", "Nothing to copy yet.", "Run a conversion first so there is something in the output panel.");
    return;
  }

  try {
    await navigator.clipboard.writeText(outputArea.value);
    setStatus("success", "Output copied to the clipboard.", "You can paste it anywhere now.");
  } catch (error) {
    setStatus(
      "error",
      "Clipboard access was blocked.",
      "You can still select the output manually and copy it."
    );
  }
});

clearButton.addEventListener("click", () => {
  inputArea.value = "";
  outputArea.value = "";
  convert();
});

swapButton.addEventListener("click", () => {
  if (!outputArea.value) {
    setStatus("idle", "Nothing to swap yet.", "Create an output first, then Swap will move it into the input panel.");
    return;
  }

  inputArea.value = outputArea.value;
  setMode(state.mode === "decode" ? "encode" : "decode");
});

sampleTextButton.addEventListener("click", () => useSample("text"));
sampleJsonButton.addEventListener("click", () => useSample("json"));

updateLabels();
convert();
