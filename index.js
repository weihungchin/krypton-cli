#!/usr/bin/env node

import chalk from 'chalk';
import inquirer from 'inquirer';
import gradient from 'gradient-string';
import chalkAnimation from 'chalk-animation';
import figlet from 'figlet';
import { createSpinner } from 'nanospinner';
import fetch from 'node-fetch';

let cryptoToSearch;
const defaultSelection = 'btc';
const selectionsMap = new Map(
  Object.entries({
    others: 'Others',
    btc: 'BTC',
    eth: 'ETH',
    avax: 'AVAX',
    luna: 'Luna',
    xrp: 'XRP',
    doge: 'Doge🐕',
  })
);

const sleep = (ms = 2000) => new Promise((r) => setTimeout(r, ms));

async function welcome() {
  const msg = `Welcome to Krypton`;
  figlet(msg, (err, data) => {
    console.log(gradient.pastel.multiline(data));
  });
  await sleep(20);
}

async function userInstruction() {
  const titleText = chalkAnimation.glitch(
    'Select from the list or enter a name'
  );
  titleText.stop();
  await sleep(100);
}

async function listDefaultSelection() {
  const answer = await inquirer.prompt({
    name: 'crypto_list',
    type: 'list',
    message: chalk.bold.whiteBright('Get Price for: \n'),
    choices: [...selectionsMap.values()],
  });
  return handleSelected(answer.crypto_list);
}

async function handleSelected(selectedValue) {
  const selectedKey = findKey(selectionsMap, (v) => v == selectedValue);
  if (selectedKey !== 'others') {
    await fetchPrice(selectedKey);
  } else {
    await askCrypto();
    await fetchPrice(cryptoToSearch);
  }
}

async function fetchPrice(selected) {
  const loadingText = `Fetching price for ${selected}...`;
  const spinner = createSpinner(chalk.italic.greenBright(loadingText)).start();
  await sleep(10);

  try {
    const res = await fetch(
      `https://data.messari.io/api/v1/assets/${selected}/metrics/market-data`
    );
    if (res && res.status == 200) {
      await handleFetchPriceSuccess(res, spinner);
    } else {
      spinner.error({
        text: `☠️ Failed to get data for ${selected}, error: ${res?.status}`,
      });
    }
  } catch (err) {
    console.log(`
    Error: ${err}
    `);
  } finally {
    await listDefaultSelection();
  }
}

async function askCrypto() {
  const answer = await inquirer.prompt({
    name: 'crypto_name',
    type: 'input',
    message: 'Which token you want to search for?',
    default() {
      return defaultSelection;
    },
  });

  cryptoToSearch = answer.crypto_name;
}
async function handleFetchPriceSuccess(response, spinner) {
  const {
    data: {
      symbol,
      name,
      market_data: { price_usd, percent_change_usd_last_24_hours },
    },
  } = await response.json();
  const label = `${name} (${symbol})`;
  const price = ` ${price_usd.toFixed(4)} USD `;
  spinner.success({
    text: `${chalk.bold.yellowBright(label)} - ${chalk.inverse(
      price
    )} ${formatPriceChange(percent_change_usd_last_24_hours)}`,
  });
}

function formatPriceChange(priceChange) {
  const formattedPriceChange = priceChange.toFixed(2);
  if (formattedPriceChange < 0) {
    return chalk.bold.redBright(`⬇${formattedPriceChange}% (24h)`);
  }
  return chalk.bold.greenBright(`⬆${formattedPriceChange}% (24h)`);
}

function findKey(map, predicate) {
  for (const [k, v] of map) {
    if (predicate(v)) {
      return k;
    }
  }
  return undefined;
}

await welcome();
await userInstruction();
await listDefaultSelection();
