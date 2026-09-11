export async function getRouteId(context) {
    const params = await context.params;
    const id = Number(params.id);
    return Number.isInteger(id) && id > 0 ? id : null;
}
