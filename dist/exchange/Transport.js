/**
 * Transport: moves raw bundle and receipt text between parties.
 *
 * A transport never decodes, re-serialises or "fixes" what it carries; the
 * receiver digests the exact text it gets. Delivery is at-least-once, so the
 * receiver's `SequenceStore` supplies idempotency. Adapters (HTTPS POST
 * with `Idempotency-Key`, queue via CloudEvents, MCP tool) ship separately;
 * {@link layerMemory} is a file-drop-like in-memory mailbox for tests.
 *
 * @since 0.1.0
 * @module
 */
import { Context, Effect, Layer } from 'effect';
/**
 * Send and receive raw text by mailbox (a party key).
 *
 * @since 0.1.0
 * @category services
 */
export class Transport extends Context.Service()('@snyder-tech/keiretsu/exchange/Transport') {
}
/**
 * In-memory drop directory per mailbox. Re-sending identical text under the
 * same name is a no-op (like overwriting a file with the same bytes); different
 * text under a taken name is kept under a suffixed name so nothing is lost.
 *
 * @since 0.1.0
 * @category layers
 */
export const layerMemory = Layer.sync(Transport, () => {
    const boxes = new Map();
    const boxOf = (mailbox) => {
        const existing = boxes.get(mailbox);
        if (existing !== undefined)
            return existing;
        const created = new Map();
        boxes.set(mailbox, created);
        return created;
    };
    const freeName = (box, name) => {
        let candidate = name;
        for (let copy = 1; box.has(candidate); copy += 1)
            candidate = `${name}~${copy}`;
        return candidate;
    };
    return {
        send: ({ to, from, name, text }) => Effect.sync(() => {
            const box = boxOf(to);
            if (box.get(name)?.text === text)
                return;
            const stored = freeName(box, name);
            box.set(stored, { name: stored, from, text });
        }),
        receive: (mailbox) => Effect.sync(() => {
            const box = boxOf(mailbox);
            const delivered = [...box.values()];
            box.clear();
            return delivered;
        }),
    };
});
//# sourceMappingURL=Transport.js.map