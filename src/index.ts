import { sendMetadataTx, registerNamespaces, registerNsMosaic } from './nem2-util';
const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');

// Command Usage Difinition
const commandDifs = [
  {
    name: 'create',
    alias: 'c',
    Type: String,
    description: 'Create \'metadata\' or \'namespace\' or \'nsmosaic\''
  },
  {
    name: 'value',
    alias: 'v',
    Type: String,
    description: 'create account metadata value'
  },
  {
    name: 'rootname',
    alias: 'r',
    Type: String,
    description: 'root nmaespace name'
  },
  {
    name: 'subname01',
    Type: String,
    description: 'sub nmaespace name'
  },
  {
    name: 'subname02',
    Type: String,
    description: 'sub nmaespace name'
  },
  {
    name: 'help',
    alias: 'h',
    type: Boolean,
    description: 'Show command usage'
  }
];

// Usage（Show '--help' command）
const sections= [
  {
    header: 'USAGE',
    content: 'ts-node index.js <subcommand>'
  },
  {
    header: 'SUBCOMMANDS',
    optionList: [
      {
        name: 'create',
        alias: 'c',
        typeLabel: '{underline string}',
        description: 'Input \'metadata\' or \'namespace\' or \'nsmosaic\'. This is a required field'
      },
      {
        name: 'value',
        alias: 'v',
        typeLabel: '{underline string}',
        description: 'Input the account metadata value'
      },
      {
        name: 'rootname',
        alias: 'r',
        typeLabel: '{underline string}',
        description: 'Input the root nmaespace name'
      },
      {
        name: 'subname01',
        typeLabel: '{underline string}',
        description: 'Input the sub nmaespace layer1 name'
      },
      {
        name: 'subname02',
        typeLabel: '{underline string}',
        description: 'Input the sub nmaespace layer2 name'
      },
      {
        name: 'help',
        alias: 'h',
        description: 'Show command usage'
      },
    ]
  },
  {
    header: 'EXAMPLE',
    optionList: [
      {
        name: 'metadata',
        description: 'ts-node index.ts -c metadata -v AGREE'
      },
      {
        name: 'namespace',
        description: 'ts-node index.ts -c namespace -r dog --subname01 shiba --subname02 male'
      },
      {
        name: 'nsmosaic',
        description: 'ts-node index.ts -c namespace -r ticket --subname01 2019 --subname02 event'
      }
    ]
  }
];

const options = commandLineArgs(commandDifs);

if(options.help) {
  const usage = commandLineUsage(sections);
  console.log(usage);
  process.exit(0);
}

switch (options.create) {
  case 'metadata':
    console.log(options.value);
    sendMetadataTx(options.value);
    break;
  case 'namespace':
    registerNamespaces(options.rootname, options.subname01, options.subname02);
    break;
  case 'nsmosaic':
    registerNsMosaic(options.rootname, options.subname01, options.subname02);
    break;
  default:
    console.log('Please add \'--help\' option for usage');
    break;
}
