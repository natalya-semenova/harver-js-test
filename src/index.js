import {
  getRandomWordSync,
  getRandomWord,
} from 'word-maker';

console.log('It works!');

// YOUR CODE HERE
import fetch from 'isomorphic-fetch';

import {
  __,
  always,
  anyPass,
  compose,
  cond,
  equals,
  map,
  modulo,
  range,
  partial,
  T,
  zip,
} from 'ramda';
import {
  URL,
} from 'url';


const sequence = range(1, 101);
const printDevider = t => console.log(`\n\n==== Task #${t} is done===`);

// Task #1
// Print numbers from 1 to 100 to the console, but for each number also print a random word using the function `getRandomWordSync`.

let printFormattedString = num =>  console.log(`${num}: ${getRandomWordSync()}`);
const doTaskOne = map(printFormattedString);

doTaskOne(sequence);
printDevider(1);

// Task #2
// Modify your code to be a "Fizz Buzz" program. That is, print the numbers as in the previous step, but
// for multiples of three, print "Fizz" (instead of the random word), for multiples of five, print "Buzz" and
// for numbers which are both multiples of three and five, print "FizzBuzz".

const getModuloBy = x => modulo(__, x);
const isZero = equals(0);
const isZeroByModul = x => compose(isZero, getModuloBy(x));

const isFizz = isZeroByModul(3);
const isBuzz = isZeroByModul(5);
const isFizzBuzz = isZeroByModul(15);
const defineWord = cond([
  [isFizzBuzz, always('Fizz Buzz')],
  [isFizz, always('Fizz')],
  [isBuzz, always('Buzz')],
  [T, getRandomWordSync],
]);

printFormattedString = num => console.log(`${num}: ${defineWord(num)}`);
const doTaskTwo = map(printFormattedString);

doTaskTwo(sequence);
printDevider(2);

// Task #3
// Create a version of steps *1* and *2* using the **asynchronous** function, `getRandomWord`. This function
// returns a Promise, which resolves to a random word string. The numbers may or may not be in numerical order.

const defineWordAsync = cond([
  [isFizzBuzz, always('Fizz Buzz')],
  [isFizz, always('Fizz')],
  [isBuzz, always('Buzz')],
  [T, getRandomWord],
]);
const createFormattedString = ([n, w]) => `${n}: ${w}`;
const createFormattedStringArr = compose(
  map(createFormattedString),
  zip(sequence),
);

async function doTaskThree() {
  try {
    const words = await Promise.all(
      sequence.map(defineWordAsync)
    );

    return createFormattedStringArr(words);
  } catch(e) {
    console.error(`Obtaining async words array failed: ${e}`);
  }
};

doTaskThree()
  .then(map(console.log))
  .finally(() => printDevider(3));


// Task #4
// Add error handling to both the synchronous and asynchronous solutions
// (calling `getRandomWord({ withErrors: true })` will intermitently throw an error instead of return a random word).
// When an error is caught, the programm should print "Doh!" instead of the random word, "Fizz", "Buzz" or "FizzBuzz"

const stubWord = 'Doh!';

// sync

const defineWordWithPotentialFail = cond([
  [isFizzBuzz, always('Fizz Buzz')],
  [isFizz, always('Fizz')],
  [isBuzz, always('Buzz')],
  [T, partial(getRandomWordSync, [{ withErrors: true }])],
]);

printFormattedString = num =>  {
  let word;

  try {
    word = defineWordWithPotentialFail(num);
  } catch(e) {
    word = stubWord;
  }

  console.log(`${num}: ${word}`);
};
const doTaskFourSync = map(printFormattedString);

doTaskFourSync(sequence);
printDevider('4 sync');

// async

const defineWordAsyncWithPotentialFail = cond([
  [isFizzBuzz, always('Fizz Buzz')],
  [isFizz, always('Fizz')],
  [isBuzz, always('Buzz')],
  [T, partial(getRandomWord, [{ withErrors: true }])],
]);

async function doTaskFourSyncAsync() {
  try {
    const words = await Promise.all(
      sequence.map(defineWordAsyncWithPotentialFail)
        .map(p => p.catch ? p.catch(always(stubWord)) : p)
    );

    return createFormattedStringArr(words);
  } catch(e) {
    console.error(`Obtaining async words array failed: ${e}`);
  }
};

doTaskFourSyncAsync()
  .then(map(console.log))
  .finally(() => printDevider('4 async'));


// Tast #5
// For **Node.JS developers**: Instead of printing the console. Write the information to a file in the root of this project. For **Frontend** developers, send your result to an HTTP endpoint (since there is no running endpoint, this
// part of your solution does not need to actually run)

const stubBackBaseUrl = 'http://test.test';
const isPostPutPatch = anyPass([equals('POST'), equals('PUT'), equals('PATCH')]);
const restUrl = part => new URL(part, stubBackBaseUrl);

async function request(url, method = 'GET', body = undefined) {
  const requestConfig = {
    method,
    headers: { },
  };

  if (isPostPutPatch(method) && body) {
    requestConfig.headers['Content-Type'] = 'application/json';
    requestConfig.body = body;
  }

  const response = await fetch(url.href, requestConfig);
  const responseData = await response.text();

  if (!response.ok) {
    throw new Error(`Server responded with non-ok code: ${response.status}`);
  }

  if (responseData.length) {
    return {
      body: JSON.parse(responseData),
      headers: response.headers,
    };
  }

  return { headers: response.headers };
}

const sendRequestToBack = (data) => {
  const body = JSON.stringify({ data });

  return request(restUrl('/api/v1/strings/'), 'POST', body);
};

async function doTaskFive() {
  const data = await doTaskFourSyncAsync();

  try {
    await sendRequestToBack(data);
  } catch(e) {
    console.error(`Sending request failed: ${e}`);
  }
}

doTaskFive()
.then(() => printDevider(5));
