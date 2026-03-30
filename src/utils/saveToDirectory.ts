export async function saveBlobToDirectory(
  blob: Blob,
  filename: string,
): Promise<boolean> {
  const w = window as unknown as {
    showDirectoryPicker?: () => Promise<{
      getFileHandle: (name: string, options?: { create?: boolean }) => Promise<{
        createWritable: () => Promise<WritableStreamDefaultWriter | any>
      }>
    }>
  }

  if (!w.showDirectoryPicker) return false

  const dirHandle = await w.showDirectoryPicker()
  const fileHandle = await dirHandle.getFileHandle(filename, { create: true })
  const writable = await fileHandle.createWritable()
  await writable.write(blob)
  await writable.close()
  return true
}

