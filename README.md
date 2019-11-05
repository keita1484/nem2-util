# nem2-util
## Installation
1. `git clone git@github.com:keita1484/nem2-util.git`
2. `cd nem2-util`
3. `npm install`

## NEM2-UTIL USAGE
`ts-node index.js <subcommand>`

Change to the `/src` directory and execute the following command

| Command                       |  Description  |
| ----------------------------- | ------------- |
| -c, --create string            |   Input 'metadata' or 'namespace' or 'nsmosaic'. This is a required field |
| -v, --value string                |   Input the account metadata value |
| -r, --rootname string                |   Input the root nmaespace name |
| --subname01 string     |   Input the sub nmaespace layer1 name |
| --subname02 string     |   Input the sub nmaespace layer2 name |
| -h, --help string      |   Show command usage |

## EXAMPLE
* metadata
`ts-node index.ts -c metadata -v AGREE`
* namespace
`ts-node index.ts -c namespace -r dog --subname01 shiba --subname02 male`
* namespace & mosaic
`ts-node index.ts -c namespace -r ticket --subname01 2019 --subname02 event`