export async function handleAuthPopupRequest():Promise<Response>{return new Response('Workspace OAuth is not available. Use /login for email authentication.',{status:404});}
