// Legacy upload helper removed from production.

async function upload() {
  throw new Error('Legacy upload helper is removed from production');
}

export { upload };
export default upload;