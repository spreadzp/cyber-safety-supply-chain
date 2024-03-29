# SupplyCore
This is the project for supply chain.

 #### The following commands are available:

- Install the dependencies by running npm install.
- Comment line 27 of ./node_modules/truffle-contract/contract.js.
- Run the local network npm run truffle:develop.
- To deploy the smart contracts to the blockchain: npm run truffle:migrate.
- To run the frontend locally npm start.
- Create a user account with the "Register" button of SupplyCore.
- Add balance to the user accounts using Metamask or the truffle-develop command line, as follows:
- Change the truffle-config.js and the app.configh.ts with your own blockchain network.
- Get the address of an automatically generated truffle-develop wallet (e.g. 0x627306090abab3a6e1400e9345bc60c78a8bef57)
- Get the address of the generated SupplyCore account ("address" field in "Identity.json") (e.g. 0xaaa1d134ad26de2636acdbb2fd6e524ea7ad551a)
- Send funds from the former to the latter with "sendTransaction", like for example: web3.eth.sendTransaction({from: "0x627306090abab3a6e1400e9345bc60c78a8bef57", to: "0xaaa1d134ad26de2636acdbb2fd6e524ea7ad551a", value: web3.toWei("5", "ether")})
- See `package.json` for more npm scripts.

 #### In order to deploy the application to a server:

1. Configure "app.config.custom.ts" and "truffle-config.custom.js" with your Ethereum/Quorum node information.
2. Set `IS_CUSTOM_NET` to `true` in "app.config.ts".
3. Run `ACCOUNT_PASSWORD=node_account_pass npm run truffle:custom-deploy`.
4. Run `npm run build-browser-release`.
5. Upload the directory `platforms/browser/www/` to your web server.
6. Open the URL pointing to your web server.

 #### Migrations:
 
Each change of version where the smart contracts have been modified will be necessary to do a migration in order to
keep the data.

 #### Terms and conditions
This project come with a default terms and conditions text. This text can be modified by adding HTML in the file `src/pages/termsandconditions/termsandconditions.html` or in `src/assets/i18n/[language].json` to the variable `app.termsDescrition`.

Licensed under the conditions of `LICENSE.md`.

Trophy icons designed by Freepik from Flaticon

Identicon generator is powered by the Identicon PHP library

