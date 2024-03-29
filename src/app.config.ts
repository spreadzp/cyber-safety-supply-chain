import { configList, blockstackConfig} from "./app.config.custom";

export class AppConfig {
    public static readonly BLOCKSTACK_CONFIG = blockstackConfig;
    public static readonly LOG_DEBUG = true;
    public static readonly IS_CUSTOM_NET = false;

    public static readonly DEFAULT_LANGUAGE = "en";
    public static readonly DEFAULT_DATE_FORMAT = "en-EU";
    public static readonly USER_LANG_STORAGE_KEY = "brightbyteUserLang";
    public static readonly AVAILABLE_LANGUAGE_KEYS = ["en", "es"];

    public static readonly NETWORK_CONFIG_LOCALHOST = [{
        gasLimit: 2000000,
        gasPrice: 10,
        netId: 4447,
        urlNode: "HTTP://127.0.0.1:9545"
    }];

    public static readonly NETWORK_CONFIG = AppConfig.IS_CUSTOM_NET ? 
    AppConfig.shuffle(configList) : AppConfig.NETWORK_CONFIG_LOCALHOST;
    public static CURRENT_NODE_INDEX = 0;
    public static readonly MAX_REVIEWER_COUNT = 4;
    public static readonly SCORE_DIVISION_FACTOR = 100;
    public static readonly SECS_TO_MS = 1000;
    public static readonly N_USER_RANKING_LIST = 5;
    public static readonly COMMIT_WEIGHT = 0.6;
    public static readonly REVIEW_WEIGHT = 0.4;

    public static readonly StorageKey = {
        USERNAME: "brightUser",
        PASSWORD: "brightPassword",
        USERMAILS: "brightEmails",
        LASTPAGE: "brightPage",
        MIGRATION: "brightMigration",
        REVIEWFILTER: "brightReviewFilter",
        REVIEWPENDINGFILTER: "brightReviewPendingFilter",
        COMMITFILTER: "brightCommitFilter",
        COMMITPENDINGFILTER: "brightCommitPendingFilter"
    };

    public static readonly UrlKey = {
        REVIEWID: "reviewId",
        COMMITID: "commitId"
    };
    
    private static shuffle(array: Array<any>): Array<any> {
        let currentIndex = array.length;
        while (0 !== currentIndex) {
            let randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
            let temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }
        return array;
    }
}

