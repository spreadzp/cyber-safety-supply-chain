import { Injectable } from "@angular/core";
import { default as Web3 } from "web3";
import { Web3Service } from "../core/web3.service";
import { ILogger, LoggerService } from "../core/logger.service";
import { HttpClient } from "@angular/common/http";
import { default as TruffleContract } from "truffle-contract";
import { AppConfig } from "../app.config";
import Tx from "ethereumjs-tx";
import { TransactionReceipt, Account } from "web3/types";
import { CommitDetails } from "../models/commit-details.model";
import { UserDetails } from "../models/user-details.model";
import { CommitComment } from "../models/commit-comment.model";
import { UserCommit } from "../models/user-commit.model";
import { UserReputation } from "../models/user-reputation.model";
import { UserCacheService } from "../domain/user-cache.service";

interface ITrbSmartContractJson {
    abi: Array<any>;
}

interface ITrbSmartContact { //Web3.Eth.Contract
    [key: string]: any;
}

/**
 *
 *
 * @export
 * @class ContractManagerService
 */
@Injectable()
export class ContractManagerService {
    private contractAddressRoot: string;
    private contractAddressBright: string;
    private contractAddressCommits: string;
    private log: ILogger;
    private web3: Web3;
    private initProm: Promise<Array<ITrbSmartContact>>;
    private currentUser: Account;
    
    /**
     *Creates an instance of ContractManagerService.
     * @param {HttpClient} http
     * @param {Web3Service} web3Service
     * @param {LoggerService} loggerSrv
     * @param {UserCacheService} userCacheSrv
     * @memberof ContractManagerService
     */
    constructor(
        private http: HttpClient,
        private web3Service: Web3Service,
        private loggerSrv: LoggerService,
        private userCacheSrv: UserCacheService
    ) {
        this.log = loggerSrv.get("ContractManagerService");
        this.web3 = web3Service.getWeb3();
        this.web3Service = web3Service;
    }

    /**
     *
     *
     * @param {Account} user
     * @param {number} cont
     * @returns {Promise<any>}
     * @memberof ContractManagerService
     */
    public init(user: Account, cont: number): Promise<any> {
        AppConfig.CURRENT_NODE_INDEX = cont;
        let configNet = AppConfig.NETWORK_CONFIG[cont];
        this.web3Service = new Web3Service(this.loggerSrv);
        this.web3 = this.web3Service.getWeb3();
        this.log.d("Initializing with URL: " + configNet.urlNode);
        this.currentUser = user;
        this.log.d("Initializing service with user ", this.currentUser);
        let contractPromises = new Array<Promise<ITrbSmartContact>>();
        let promBright = this.http.get("../assets/build/Bright.json").toPromise()
            .then((jsonContractData: ITrbSmartContractJson) => {
                let truffleContractBright = TruffleContract(jsonContractData);
                this.contractAddressBright = truffleContractBright.networks[configNet.netId].address;
                let contractBright = new this.web3.eth.Contract(jsonContractData.abi, this.contractAddressBright, {
                    from: this.currentUser.address,
                    gas: configNet.gasLimit,
                    gasPrice: configNet.gasPrice,
                    data: truffleContractBright.deployedBytecode
                });
                this.log.d("TruffleContractBright function: ", contractBright);
                this.log.d("ContractAddressBright: ", this.contractAddressBright);
                return contractBright;
            });
        contractPromises.push(promBright);
        let promCommits = this.http.get("../assets/build/Commits.json").toPromise()
            .then((jsonContractData: ITrbSmartContractJson) => {
                let truffleContractCommits = TruffleContract(jsonContractData);
                this.contractAddressCommits = truffleContractCommits.networks[configNet.netId].address;
                let contractCommits = new this.web3.eth.Contract(jsonContractData.abi, this.contractAddressCommits, {
                    from: this.currentUser.address,
                    gas: configNet.gasLimit,
                    gasPrice: configNet.gasPrice,
                    data: truffleContractCommits.deployedBytecode
                });
                this.log.d("TruffleContractBright function: ", contractCommits);
                this.log.d("ContractAddressCommits: ", this.contractAddressCommits);
                return contractCommits;
            });
        contractPromises.push(promCommits);
        let promRoot = this.http.get("../assets/build/Root.json").toPromise()
            .then((jsonContractData: ITrbSmartContractJson) => {
                let truffleContractRoot = TruffleContract(jsonContractData);
                this.contractAddressRoot = truffleContractRoot.networks[configNet.netId].address;
                let contractRoot = new this.web3.eth.Contract(jsonContractData.abi, this.contractAddressRoot, {
                    from: this.currentUser.address,
                    gas: configNet.gasLimit,
                    gasPrice: configNet.gasPrice,
                    data: truffleContractRoot.deployedBytecode
                });
                this.log.d("TruffleContractBright function: ", contractRoot);
                this.log.d("ContractAddressRoot: ", this.contractAddressRoot);
                return contractRoot;
            });
        contractPromises.push(promRoot);
        return this.initProm = Promise.all(contractPromises);
    }

    /**
     *
     *
     * @param {string} pass
     * @returns {Promise<Blob>}
     * @memberof ContractManagerService
     */
    public createUser(pass: string): Promise<Blob> {
        let createAccount = this.web3.eth.accounts.create(this.web3.utils.randomHex(32));
        let encrypted = this.web3.eth.accounts.encrypt(createAccount.privateKey, pass);
        //The blob constructor needs an array as first parameter, so it is not neccessary use toString.
        //The second parameter is the MIME type of the file.
        return new Promise((resolve, reject) => {
            resolve(new Blob([JSON.stringify(encrypted)], { type: "text/plain" }));
            reject("Not initialized");
        });
    }

    /**
     *
     *
     * @param {string} name
     * @param {string} mail
     * @returns {Promise<any>}
     * @memberof ContractManagerService
     */
    public setProfile(name: string, mail: string): Promise<any> {
        let contractArtifact;
        return this.initProm.then(([bright, commit, root]) => {
            this.log.d("Contract: ", bright);
            contractArtifact = bright;
            this.log.d("Setting profile with name and mail: ", [name, mail]);
            this.log.d("Public Address: ", this.currentUser.address);
            this.log.d("Contract artifact", contractArtifact);
            let bytecodeData = contractArtifact.methods.setProfile(name, mail).encodeABI();
            this.log.d("Bytecode data: ", bytecodeData);

            return this.sendTx(bytecodeData, this.contractAddressBright);

        }).catch(e => {
            this.log.e("Error setting profile: ", e);
            throw e;
        });
    }

    /**
     *
     *
     * @param {string} url
     * @param {string} title
     * @param {string[]} usersMail
     * @returns {Promise<any>}
     * @memberof ContractManagerService
     */
    public addCommit(url: string, title: string, usersMail: string[]): Promise<any> {
        let rootContract;
        return this.initProm.then(([bright, commit, root]) => {
            rootContract = root;
            this.log.d("Contract artifact: ", commit);
            this.log.d("Contract Address: ", this.contractAddressCommits);
            this.log.d("Public Address: ", this.currentUser.address);
            this.log.d("Variables: url ", url);
            this.log.d("UsersMail: ", usersMail);
            // let project = this.splitService.getProject(url);
            let numUsers: number = 0;
            for (let i: number = 0; i < usersMail.length; i++) {
                if (usersMail[i] !== "") {
                    numUsers++;
                }
            }
            let bytecodeData = commit.methods.setNewCommit(
                title,
                url,
                numUsers
            ).encodeABI();
            this.log.d("DATA: ", bytecodeData);
            return this.sendTx(bytecodeData, this.contractAddressCommits);
        }).then(() => {
            let emailsArray = [];
            for (let i = 0; i < usersMail.length; i++) {
                if (usersMail[i] !== "") {
                    emailsArray.push(this.web3.utils.keccak256(usersMail[i]));
                }
            }
            let bytecodeData = rootContract.methods.notifyCommit(
                url,
                emailsArray
            ).encodeABI();
            this.log.d("ByteCodeData of notifyCommit: ", bytecodeData);
            return this.sendTx(bytecodeData, this.contractAddressRoot);
        }).catch(e => {
            this.log.e("Error in addcommit: ", e);
            throw e;
        });
    }

    /**
     *
     *
     * @returns {Promise<Array<UserCommit>>}
     * @memberof ContractManagerService
     */
    public getCommits(): Promise<Array<UserCommit>> {
        let allUserCommits: Array<any>;
        let promisesPending = new Array<Promise<UserCommit>>();
        return this.initProm.then(([bright, commit, root]) => {
            this.log.d("Public Address: ", this.currentUser.address);
            this.log.d("Contract artifact", bright);
            return bright.methods.getUserCommits(this.currentUser.address).call();
        }).then((allUserCommitsRes: Array<any>) => {
            allUserCommits = allUserCommitsRes;
            return this.initProm;
        }).then(([brigh, commit, root]) => {
            for (let i = 0; i < allUserCommits[2].length; i++) {
                let promisePending: Promise<UserCommit> = commit.methods.getDetailsCommits(allUserCommits[2][i]).call()
                    .then((commitVals: any) => UserCommit.fromSmartContract(commitVals, true));
                promisesPending.push(promisePending);
            }
            return Promise.all(promisesPending);
        }).catch(err => {
            this.log.e("Error calling SupplyCore smart contract :", err);
            throw err;
        });
    }

    /**
     *
     *
     * @returns {Promise<UserCommit[][]>}
     * @memberof ContractManagerService
     */
    public getCommitsToReview(): Promise<UserCommit[][]> {
        return this.initProm
            .then(([bright, commit]) => {
                this.log.d("Public Address: ", this.currentUser.address);
                this.log.d("Contract artifact", bright);
                return bright.methods.getUserCommits(this.currentUser.address).call()
                    .then((allUserCommits: Array<any>) => {
                        let promisesPending = new Array<Promise<UserCommit>>();
                        let promisesFinished = new Array<Promise<UserCommit>>();
                        for (let i = 0; i < allUserCommits[0].length; i++) {
                            let promisePending = commit.methods.getDetailsCommits(allUserCommits[0][i]).call()
                                .then((commitVals: any) => {
                                    return UserCommit.fromSmartContract(commitVals, true);
                                });
                            promisesPending.push(promisePending);
                        }
                        for (let i = 0; i < allUserCommits[1].length; i++) {
                            let promiseFinished = commit.methods.getDetailsCommits(allUserCommits[1][i]).call()
                                .then((commitVals: any) => {
                                    return UserCommit.fromSmartContract(commitVals, false);
                                });
                            promisesFinished.push(promiseFinished);
                        }
                        return Promise.all([Promise.all(promisesPending), Promise.all(promisesFinished)]);
                    });
            }).catch(err => {
                this.log.e("Error calling SupplyCore smart contract :", err);
                throw err;
            });
    }

    /**
     *
     *
     * @param {string} url
     * @returns {Promise<CommitDetails>}
     * @memberof ContractManagerService
     */
    public getDetailsCommits(url: string): Promise<CommitDetails> {
        return this.initProm.then(([bright, commit, root]) => {
            return commit.methods.getDetailsCommits(this.web3.utils.keccak256(url)).call()
                .then((commitVals: any) => {
                    return CommitDetails.fromSmartContract(commitVals);
                });
        }).catch(err => {
            this.log.e("Error calling SupplyCore smart contract :", err);
            throw err;
        });
    }

    /**
     *
     *
     * @param {string} url
     * @returns {Promise<UserCommit>}
     * @memberof ContractManagerService
     */
    public getCommitDetails(url: string): Promise<UserCommit> {
        return this.initProm.then(([bright, commit, root]) => {
            return commit.methods.getDetailsCommits(this.web3.utils.keccak256(url)).call()
                .then((commitVals: any) => {                
                    return UserCommit.fromSmartContract(commitVals, false);
                });
        }).catch(err => {
            this.log.e("Error calling SupplyCore smart contract :", err);
            throw err;
        });
    }

    /**
     *
     *
     * @param {string} url
     * @param {string} text
     * @param {number[]} points
     * @returns {Promise<any>}
     * @memberof ContractManagerService
     */
    public setReview(url: string, text: string, points: number[]): Promise<any> {
        return this.initProm.then(([bright, commit, root]) => {
            let contractArtifact = commit;
            this.log.d("Public Address: ", this.currentUser.address);
            this.log.d("Contract artifact", contractArtifact);
            let bytecodeData = contractArtifact.methods.setReview(url, text, points).encodeABI();
            this.log.d("Introduced url: ", url);
            this.log.d("Introduced text: ", text);
            this.log.d("Introduced points: ", points);
            this.log.d("DATA: ", bytecodeData);

            return this.sendTx(bytecodeData, this.contractAddressCommits);

        }).catch(e => {
            this.log.e("Error getting nonce value: ", e);
            throw e;
        });

    }

    /**
     *
     *
     * @param {string} url
     * @returns {Promise<CommitComment[][]>}
     * @memberof ContractManagerService
     */
    public getCommentsOfCommit(url: string): Promise<CommitComment[][]> {
        return this.initProm.then(([bright, commit, root]) => {
            this.log.d("Public Address: ", this.currentUser.address);
            this.log.d("Contract artifact", commit);
            let urlKeccak = this.web3.utils.keccak256(url);
            return commit.methods.getCommentsOfCommit(urlKeccak).call()
                .then((allComments: Array<any>) => {
                    let promisesPending = new Array<Promise<CommitComment>>();
                    let promisesFinished = new Array<Promise<CommitComment>>();
                    for (let i = 0; i < allComments[0].length; i++) {
                        let promisePending = commit.methods.getCommentDetail(urlKeccak, allComments[0][i]).call()
                            .then((commitVals: any) => {
                                return CommitComment.fromSmartContract(commitVals, "");
                            });
                        promisesPending.push(promisePending);
                    }
                    for (let i = 0; i < allComments[1].length; i++) {
                        let promiseFinished = commit.methods.getCommentDetail(urlKeccak, allComments[1][i]).call()
                            .then((commitVals: any) => {
                                return Promise.all([commitVals, bright.methods.getUserName(commitVals[4]).call()]);
                            })
                            .then((data) => {
                                return CommitComment.fromSmartContract(data[0], data[1]);
                            });
                        promisesFinished.push(promiseFinished);
                    }
                    return Promise.all([Promise.all(promisesPending), Promise.all(promisesFinished)]);
                });
        }).catch(err => {
            this.log.e("Error calling SupplyCore smart contract :", err);
            throw err;
        });
    }

    /**
     *
     *
     * @param {string} hash
     * @returns {Promise<UserDetails>}
     * @memberof ContractManagerService
     */
    public getUserDetails(hash: string): Promise<UserDetails> {
        return this.userCacheSrv.getUser(hash).catch(() => {
            return this.initProm.then(([bright, commit, root]) => {
                this.log.d("Public Address: ", this.currentUser.address);
                this.log.d("Contract artifact", bright);
                return bright.methods.getUser(hash).call();
            }).then((userVals: Array<any>) => {
                userVals[7] = hash;
                let userValsToUSerDetails = UserDetails.fromSmartContract(userVals);
                this.userCacheSrv.set(hash, userValsToUSerDetails);
                return userValsToUSerDetails;
            }).catch(err => {
                this.log.e("Error calling SupplyCore smart contract :", err);
                throw err;
            });
        });
    }

    /**
     *
     *
     * @param {string} url
     * @param {number} index
     * @param {number} value
     * @returns {Promise<any>}
     * @memberof ContractManagerService
     */
    public setThumbReviewForComment(url: string, index: number, value: number): Promise<any> {
        return this.initProm.then(([bright, commit, root]) => {
            this.log.d("Public Address: ", this.currentUser.address);
            this.log.d("Contract artifact", root);
            return this.getCommentsOfCommit(url)
                .then((arrayOfComments: CommitComment[][]) => {
                    let bytecodeData = root.methods.setVote(url, arrayOfComments[1][index].user, value).encodeABI();
                    this.log.d("Introduced index: ", index);
                    this.log.d("Introduced value: ", value);
                    this.log.d("DATA: ", bytecodeData);
                    return this.sendTx(bytecodeData, this.contractAddressRoot);
                });
        }).catch(e => {
            this.log.e("Error getting nonce value: ", e);
            throw e;
        });
    }

    /**
     *
     *
     * @param {string} url
     * @returns
     * @memberof ContractManagerService
     */
    public reviewChangesCommitFlag(url: string) {
        return this.initProm.then(([bright, commit, root]) => {
            this.log.d("Public Address: ", this.currentUser.address);
            this.log.d("Contract artifact", root);
            let bytecodeData = root.methods.readCommit(url).encodeABI();
            this.log.d("Introduced url: ", url);
            this.log.d("DATA: ", bytecodeData);
            return this.sendTx(bytecodeData, this.contractAddressRoot);

        }).catch(e => {
            this.log.e("Error getting nonce value: ", e);
            throw e;
        });
    }

    /**
     *
     *
     * @returns {Promise<UserReputation[]>}
     * @memberof ContractManagerService
     */
    public getAllUserReputation(): Promise<UserReputation[]> {
        let contractArtifact;
        return this.initProm.then(([bright, commit, root]) => {
            contractArtifact = bright;
            return contractArtifact.methods.getNumbers().call();
        }).then((numberUsers: number) => {
            this.log.d("Number of users: ", numberUsers);
            let promises = new Array<Promise<UserReputation>>();
            for (let i = 0; i < numberUsers; i++) {
                let promise = contractArtifact.methods.getAllUserReputation(i).call()
                    .then((commitsVals: Array<any>) => {
                        this.log.d("User reputation: ", commitsVals);
                        return UserReputation.fromSmartContract(commitsVals);
                    });
                promises.push(promise);
            }
            return Promise.all(promises);
        }).catch(err => {
            this.log.e("Error getting ranking :", err);
            throw err;
        });
    }

    /**
     *
     *
     * @param {number} season
     * @param {boolean} global
     * @returns {Promise<UserReputation[]>}
     * @memberof ContractManagerService
     */
    public getAllUserReputationSeason(season: number, global: boolean): Promise<UserReputation[]> {
        let contractArtifact;
        return this.initProm.then(([bright, commit, root]) => {
            contractArtifact = bright;
            return contractArtifact.methods.getNumbers().call();
        }).then((numberUsers: number) => {
            this.log.d("Number of users: ", numberUsers);
            let promises = new Array<Promise<UserReputation>>();
            for (let i = 0; i < numberUsers; i++) {
                let promise: Promise<UserReputation>;
                if(global) {
                    promise = contractArtifact.methods.getAllUserReputation(i).call()
                    .then((commitsVals: Array<any>) => {
                        this.log.d("User reputation: ", commitsVals);
                        return UserReputation.fromSmartContract(commitsVals);
                    });
                } else {
                    promise = contractArtifact.methods.getUserReputation(i, season).call()
                    .then((commitsVals: Array<any>) => {
                        this.log.d("Users reputation in season " + season + ": ", commitsVals);
                        return UserReputation.fromSmartContract(commitsVals);
                    });
                }
                promises.push(promise);
            }
            return Promise.all(promises);
        }).catch(err => {
            this.log.e("Error getting ranking :", err);
            throw err;
        });
    }

    /**
     *
     *
     * @returns {Promise<number[]>}
     * @memberof ContractManagerService
     */
    public getCurrentSeason(): Promise<number[]> {
        let contractArtifact;
        return this.initProm.then(([bright, commit, root]) => {
            contractArtifact = bright;
            return contractArtifact.methods.getCurrentSeason().call();
        });
    }
    
    /**
     *
     *
     * @param {*} url
     * @returns {Promise<boolean>}
     * @memberof ContractManagerService
     */
    public getFeedback(url): Promise<boolean> {
        let urlKeccak = this.web3.utils.keccak256(url);
        return this.initProm.then(contract => {
            let promise = contract[0].methods.getFeedback(urlKeccak).call();
            return promise;
        }).catch(err => {
            this.log.e("Error getting urls (Feedback) :", err);
            throw err;
        });
    }

    /**
     *
     *
     * @param {string} url
     * @returns
     * @memberof ContractManagerService
     */
    public setFeedback(url: string) {
        return this.initProm.then(([bright, commit, root]) => {
            this.log.d("Public Address: ", this.currentUser.address);
            this.log.d("Contract artifact", root);
            let bytecodeData = root.methods.setFeedback(url, this.currentUser.address).encodeABI();
            this.log.d("Introduced url: ", url);
            this.log.d("DATA: ", bytecodeData);
            return this.sendTx(bytecodeData, this.contractAddressRoot);

        }).catch(e => {
            this.log.e("Error getting nonce value: ", e);
            throw e;
        });
    }

    /**
     *
     *
     * @param {string} url
     * @returns {Promise<string[][]>}
     * @memberof ContractManagerService
     */
    public getReviewers(url: string): Promise<string[][]> {
        return this.initProm.then(([bright, commit, root]) => {
            this.log.d("Public Adress: ", this.currentUser.address);
            let urlKeccak = this.web3.utils.keccak256(url);
            return commit.methods.getCommentsOfCommit(urlKeccak).call();
        });
    }

    /**
     *
     *
     * @param {string} url
     * @returns {Promise<UserDetails[][]>}
     * @memberof ContractManagerService
     */
    public getReviewersName(url: string): Promise<UserDetails[][]> {
        return this.getReviewers(url).then(rsp => {
            
            let userPending = rsp[0].map((usr) => {
                return this.getUserDetails(usr);
            });
            let userFinished = rsp[1].map((usr) => {
                return this.getUserDetails(usr);
            });
            let userPromise = [userPending, userFinished];
            return Promise.all(userPromise.map(UsrPro => {
                return Promise.all(UsrPro);
                })
            );
        });
    }

    /**
     *
     *
     * @returns {Promise<Array<ITrbSmartContact>>}
     * @memberof ContractManagerService
     */
    public getContracts(): Promise<Array<ITrbSmartContact>>{
        return this.initProm;
    }
    
    /**
     *
     *
     * @returns
     * @memberof ContractManagerService
     */
    public getAddresses(){
        return ([this.contractAddressRoot, this.contractAddressBright, this.contractAddressCommits]);
    }

    /**
     *
     *
     * @param {*} bytecodeData
     * @param {*} contractAddress
     * @returns {(Promise<void | TransactionReceipt>)}
     * @memberof ContractManagerService
     */
    public sendTx(bytecodeData, contractAddress): Promise<void | TransactionReceipt> { //PromiEvent<TransactionReceipt>
        return this.web3.eth.getTransactionCount(this.currentUser.address, "pending")
            .then(nonceValue => {
                let nonce = "0x" + (nonceValue).toString(16);
                this.log.d("Value NONCE", nonce);
                let rawtx = {
                    nonce: nonce,
                    // I could use web3.eth.getGasPrice() to determine which is the gasPrise needed.
                    gasPrice: this.web3.utils.toHex(AppConfig.NETWORK_CONFIG[AppConfig.CURRENT_NODE_INDEX].gasPrice),
                    gasLimit: this.web3.utils.toHex(AppConfig.NETWORK_CONFIG[AppConfig.CURRENT_NODE_INDEX].gasLimit),
                    to: contractAddress,
                    data: bytecodeData
                };
                const tx = new Tx(rawtx);
                let priv = this.currentUser.privateKey.substring(2);
                let privateKey = new Buffer(priv, "hex");
                tx.sign(privateKey);

                let raw = "0x" + tx.serialize().toString("hex");
                this.log.d("Rawtx: ", rawtx);
                this.log.d("Priv is 0x: ", priv);
                this.log.d("privatekey: ", privateKey);
                this.log.d("Raw: ", raw);
                this.log.d("tx unsign: ", tx);
                return this.web3.eth.sendSignedTransaction(raw);
            }).then(transactionHash => {
                this.log.d("Hash transaction", transactionHash);
                return transactionHash;
            }).catch(e => {
                this.log.e("Error in transaction (sendTx function): ", e);
                throw e;
            });
    }
}
