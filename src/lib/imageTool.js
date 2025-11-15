const SDK_URL = 'https://js.puter.com';
const WAIT_INTERVAL_MS = 150;
const MAX_WAIT_MS = 15000;
let sdkRequested = false;

function ensurePuterScript() {
  if (typeof document === 'undefined') {
    return null;
  }

  const existing = document.querySelector(`script[src="${SDK_URL}"]`);
  if (existing) {
    return existing;
  }

  const script = document.createElement('script');
  script.src = SDK_URL;
  script.async = true;
  script.defer = true;
  script.setAttribute('data-puter-sdk', 'true');
  document.head.appendChild(script);
  sdkRequested = true;
  return script;
}

async function waitForPuter() {
  if (typeof window === 'undefined') {
    throw new Error('Image generation is only available in the browser.');
  }

  if (!sdkRequested) {
    ensurePuterScript();
  }

  if (window.puter?.ai?.generateTextToImage) {
    return window.puter;
  }

  let elapsed = 0;
  const scriptEl = ensurePuterScript();

  return new Promise((resolve, reject) => {
    const fail = (message) => {
      clearInterval(intervalId);
      if (scriptEl) {
        scriptEl.removeEventListener('error', onError);
      }
      reject(new Error(message));
    };

    const onError = () => fail('Unable to download the Puter AI SDK.');
    if (scriptEl) {
      scriptEl.addEventListener('error', onError);
    }

    const intervalId = setInterval(() => {
      elapsed += WAIT_INTERVAL_MS;
      if (window.puter?.ai?.generateTextToImage) {
        clearInterval(intervalId);
        if (scriptEl) {
          scriptEl.removeEventListener('error', onError);
        }
        resolve(window.puter);
        return;
      }
      if (elapsed >= MAX_WAIT_MS) {
        fail('Puter AI SDK failed to load in time.');
      }
    }, WAIT_INTERVAL_MS);
  });
}

export async function generateImage(prompt) {
  const trimmed = prompt?.trim();
  if (!trimmed) {
    throw new Error('Please enter a description for the image.');
  }

  const sdk = await waitForPuter();
  try {
    const result = await sdk.ai.generateTextToImage(trimmed);
    if (!result?.data_url) {
      throw new Error('Image generation returned empty data.');
    }
    return result.data_url;
  } catch (error) {
    const message = error?.message || 'Unable to generate image right now.';
    throw new Error(message);
  }
}
