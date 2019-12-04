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
| -c, --create string            |   Input 'namespace' or 'nsmosaic'. This is a required field |
| -r, --rootname string                |   Input the root namaespace name |
| --sn1 string     |   Input the sub namaespace layer1 name |
| --sn2 string     |   Input the sub namaespace layer2 name |
| -r, --duration number     |   Input the duration for renting namespace |
| -a, --ammount number     |   Input the mosaic supply ammount |
| -h, --help string      |   Show command usage |

## EXAMPLE
* namespace
`ts-node index.ts -c ns -r dog --sn1 shiba --sn2 male -d 1000`
* namespace & mosaic
`ts-node index.ts -c nsmosaic -r tickets --sn1 2019 --sn2 event -d 2000 -a 20`