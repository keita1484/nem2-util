import { sendMetadataTx, registerNamespaces, registerNsMosaic } from './nem2-util';
const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');

// Command Usage Difinition
const commandDifs = [
  {
    name: 'create',
    alias: 'c',
    Type: String,
    description: '\'accountmeta\' or \'ns\' or \'nsmosaic\''
  },
  {
    name: 'key',
    alias: 'k',
    Type: String,
    description: 'account metadata key'
  },
  {
    name: 'value',
    alias: 'v',
    Type: String,
    description: 'account metadata value'
  },
  {
    name: 'rootname',
    alias: 'r',
    Type: String,
    description: 'root namaespace name'
  },
  {
    name: 'sn1',
    Type: String,
    description: 'sub namaespace01 name'
  },
  {
    name: 'sn2',
    Type: String,
    description: 'sub namaespace02 name'
  },
  {
    name: 'duration',
    alias: 'd',
    type: Number,
    defaultValue: 1000,
    description: 'duration for renting namespace'
  },
  {
    name: 'ammount',
    alias: 'a',
    type: Number,
    defaultValue: 10,
    description: 'mosaic supply ammount'
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
    optionList: commandDifs  
  },
  {
    header: 'EXAMPLE',
    optionList: [
      {
        name: 'Namespaces',
        type: Boolean,
        description: 'ts-node index.ts -c ns -r dog --sn1 shiba --sn2 male -d 1000'
      },
      {
        name: 'Namespaces & Mosaic',
        type: Boolean,
        description: 'ts-node index.ts -c nsmosaic -r tickets --sn1 2019 --sn2 event -d 2000 -a 20'
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
  case 'accountmeta':
    sendMetadataTx(options.key, options.value);
    break;
  case 'ns':
    registerNamespaces(options.rootname, options.duration, options.sn1, options.sn2);
    break;
  case 'nsmosaic':
    registerNsMosaic(options.rootname, options.duration, options.ammount, options.sn1, options.sn2);
    break;
  default:
    console.log('Please add \'--help\' option for usage');
    break;
}
