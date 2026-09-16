Deno.serve(async (request: Request) => {
  try {
    const { app } = await import("./generated-app.js");
    return await app.fetch(request);
  } catch (error) {
    console.error(error);
    return Response.json(
      { message: "Cloud API failed to initialize." },
      { status: 500 },
    );
  }
});
