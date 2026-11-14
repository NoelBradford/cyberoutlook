// One small interface, so the sending provider can change without touching the logic: send({ to, subject, text, headers }).
// The provider is not chosen yet (see docs/email-platform-design.md). Two stand-ins:

// For tests and local runs: keeps messages in memory.
export function memoryMailer() {
  const sent = [];
  return { sent, async send(m) { sent.push(m); } };
}

// Cloudflare Email Sending through a Worker binding (beta, Workers Paid). Binding name and call shape follow Cloudflare's docs at the
// time of writing and must be checked against the current docs before use. It sends plain text only.
export function cloudflareMailer(env) {
  return {
    async send({ to, subject, text, headers }) {
      if (!env.EMAIL) throw new Error('No email binding is configured');
      await env.EMAIL.send({ from: env.SENDER_ADDRESS, to, subject, text, headers });
    },
  };
}
