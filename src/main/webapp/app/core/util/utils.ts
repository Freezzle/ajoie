export function copyToClipboard(value: string | null | undefined, onSuccess?: () => void,
                                onError?: (err: any) => void): void {
  if (!value) {
    return;
  }

  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess();
    }
  };

  const handleError = (err: any) => {
    if (onError) {
      onError(err);
    }
  };

  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    navigator.clipboard.writeText(value).then(handleSuccess).catch(() => {
      fallbackCopy(value, handleSuccess, handleError);
    });
  } else {
    fallbackCopy(value, handleSuccess, handleError);
  }

  function fallbackCopy(text: string, successCallback: () => void, errorCallback: (err: any) => void) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.setAttribute('readonly', '');
    document.body.appendChild(textarea);
    textarea.select();

    try {
      const successful = document.execCommand('copy');
      if (successful) {
        successCallback();
      } else {
        throw new Error('document.execCommand("copy") a échoué');
      }
    } catch (err) {
      errorCallback(err);
    } finally {
      document.body.removeChild(textarea);
    }
  }
}
