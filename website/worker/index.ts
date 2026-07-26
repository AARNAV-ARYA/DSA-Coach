const worker = {
  fetch(): Response {
    return new Response(null, { status: 404 });
  },
};

export default worker;
