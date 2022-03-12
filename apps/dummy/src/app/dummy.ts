// eslint-disable-next-line no-eval
const argv = eval('process').argv as string[];
export function dummy() {
  setInterval(() => {
    console.log(argv.slice(2));
  }, 1000);
}
