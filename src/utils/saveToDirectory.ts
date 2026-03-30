export async function saveBlobToLocation(blob: Blob, filename: string): Promise<boolean> {
  const w = window as unknown as {
    showSaveFilePicker?: (options: { suggestedName: string }) => Promise<{
      createWritable: () => Promise<{ write: (b: Blob) => Promise<void> | void; close: () => Promise<void> | void }>
    }>
    showDirectoryPicker?: () => Promise<{
      getFileHandle: (
        name: string,
        options?: { create?: boolean },
      ) => Promise<{
        createWritable: () => Promise<{ write: (b: Blob) => Promise<void> | void; close: () => Promise<void> | void }>
      }>
    }>
  }

  // Prefer save-file picker: it lets the user pick folder location
  // and is generally more stable across browsers.
  if (w.showSaveFilePicker) {
    try {
      const handle = await w.showSaveFilePicker({ suggestedName: filename })
      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()
      return true
    } catch {
      // user cancelled or picker failed - fallback to other mechanisms
    }
  }

  if (w.showDirectoryPicker) {
    try {
      const dirHandle = await w.showDirectoryPicker()
      const fileHandle = await dirHandle.getFileHandle(filename, { create: true })
      const writable = await fileHandle.createWritable()
      await writable.write(blob)
      await writable.close()
      return true
    } catch {
      // fallback below
    }
  }

  return false
}

