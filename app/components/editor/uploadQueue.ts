const droppedFilesQueue: File[] = [];

export function enqueueDroppedFile(file: File) {
  droppedFilesQueue.push(file);
}

export function dequeueDroppedFile(): File | undefined {
  return droppedFilesQueue.shift();
}


