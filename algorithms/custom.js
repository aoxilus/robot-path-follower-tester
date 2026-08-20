export function computeCustomCommand(ctx) {
    const omega = Math.max(-ctx.MAX_OMEGA, Math.min(ctx.MAX_OMEGA, ctx.headingErr * 2));
    return {
        v: ctx.MAX_SPEED * 0.6,
        omega,
    };
}
