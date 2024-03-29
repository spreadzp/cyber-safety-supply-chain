import { AppConfig } from "./../app.config";
import { Injectable } from "@angular/core";
import { ILogger, LoggerService } from "../core/logger.service";
import { LocalStorageService } from "../core/local-storage.service";

/**
 *
 *
 * @export
 * @class UserLoggerService
 */
@Injectable()
export class UserLoggerService {

    private readonly STORAGE_KEY_USERNAME = AppConfig.StorageKey.USERNAME;
    private readonly STORAGE_KEY_PASSWORD = AppConfig.StorageKey.PASSWORD;
    private readonly STORAGE_KEY_MIGRATION = AppConfig.StorageKey.MIGRATION;
    private log: ILogger;

    /**
     *Creates an instance of UserLoggerService.
    * @param {LoggerService} loggerSrv
    * @param {LocalStorageService} storageSrv
    * @memberof UserLoggerService
    */
    constructor(loggerSrv: LoggerService, private storageSrv: LocalStorageService) {
        this.log = loggerSrv.get("UserLoggerService");
    }
    /**
     *
     *
     * @param {string} user
     * @param {string} password
     * @memberof UserLoggerService
     */
    public setAccount(user: string, password: string) {
        this.storageSrv.set(this.STORAGE_KEY_USERNAME, JSON.stringify(user));
        this.storageSrv.set(this.STORAGE_KEY_PASSWORD, password);
    }

    public retrieveAccount(): any {
        let user = JSON.parse(this.storageSrv.get(this.STORAGE_KEY_USERNAME));
        let pass = this.storageSrv.get(this.STORAGE_KEY_PASSWORD);
        return { user: user, password: pass };
    }

    public logout() {
        this.storageSrv.remove(this.STORAGE_KEY_USERNAME);
        this.storageSrv.remove(this.STORAGE_KEY_PASSWORD);
    }

    public getMigration(): boolean {
        let migration = this.storageSrv.get(this.STORAGE_KEY_MIGRATION);
        return Boolean(migration);
    }
    public setMigration() {
        this.storageSrv.set(this.STORAGE_KEY_MIGRATION, true);
    }

}
