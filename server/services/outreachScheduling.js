// Bound database concurrency and settle the entire current group before rollback.
// Promise.all alone can reject while other writes are still in flight.
export async function runSchedulingTasks(items, task) {
  for (let offset = 0; offset < items.length; offset += 6) {
    const settled = await Promise.allSettled(items.slice(offset, offset + 6).map((item, index) => task(item, offset + index)));
    const failure = settled.find(result => result.status === 'rejected');
    if (failure) throw failure.reason;
  }
}
