/**
 * Hashes a string using the SHA-256 algorithm.
 * @param {string} str The string to hash.
 * @returns {Promise<string>} A promise that resolves to the hex-encoded hash string.
 */
export async function hashStringSHA256(str: string): Promise<string> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error("A API de Criptografia não está disponível. Para que o login funcione, a aplicação deve ser acessada via um endereço seguro (HTTPS).");
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}