import { sendMetadataTx, registerNamespaces } from './nem2-util';
const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');

// Command Usage Difinition
const commandDifs = [
  {
    name: 'create',
    alias: 'c',
    Type: String,
    description: 'Create \'metadata\' or \'namespace\''
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
    name: 'subname',
    alias: 's',
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
    content: 'node index.js <subcommand>'
  },
  {
    header: 'SUBCOMMANDS',
    optionList: [
      {
        name: 'create',
        alias: 'c',
        typeLabel: '{underline string}',
        description: 'Input \'metadata\' or \'namespace\'. This is a required field'
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
        name: 'subname',
        alias: 's',
        typeLabel: '{underline string}',
        description: 'Input the sub nmaespace name'
      },
      {
        name: 'help',
        alias: 'h',
        description: 'Show command usage'
      },
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
    registerNamespaces(options.rootname, options.subname);
    break;
  default:
    console.log('Please add \'--help\' option for usage');
    break;
}
