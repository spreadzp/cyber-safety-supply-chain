import { Component } from "@angular/core";
import { PopoverController } from "ionic-angular";
import { ILogger, LoggerService } from "../../core/logger.service";
import { AppVersionService } from "../../core/app-version.service";
import { UserLoggerService } from "../../domain/user-logger.service";
import { TermsAndConditions } from "../../pages/termsandconditions/termsandconditions";
import { UserSession } from "blockstack";
import { AppConfig } from "../../app.config";
@Component({
    selector: "page-login",
    templateUrl: "login.html"
})

export class LoginPage {
    public userSession: UserSession;
    public msg: string;
    public text: any;
    public debuggingText: string;
    public isDebugMode = false;
    public appVersion = "DEV";
    public migrationDone = false;
    public loginState = "login";
    private log: ILogger;


    constructor(
        private popoverCtrl: PopoverController,
        private userLoggerService: UserLoggerService,
        loggerSrv: LoggerService,
        appVersionSrv: AppVersionService
    ) {
        this.log = loggerSrv.get("LoginPage");
        appVersionSrv.getAppVersion().subscribe(
            ver => this.appVersion = ver,
            err => this.log.w("No app version could be detected")
        );
        
        this.migrationDone = this.userLoggerService.getMigration();
    }

    public manageEvent(e: string){
        this.loginState = e;
    }

    public showTerms(){
        let popover = this.popoverCtrl.create(TermsAndConditions, {},  {cssClass: "terms-popover"});
        popover.present();
    }
    public signIn() {
        this.userSession = new UserSession({ appConfig: AppConfig.BLOCKSTACK_CONFIG });
        this.userSession.redirectToSignIn();
        const session = this.userSession;

        if (!session.isUserSignedIn() && !session.isSignInPending()) {
            session.handlePendingSignIn()
                .then((userData) => {
                    if (!userData.username) {
                        throw new Error("This app requires a username.");
                    }
                    this.log.d("username" + userData.username);
                    this.landing();
                })
                .then((data: any) => this.log.d(data))
                .catch(e => {
                    this.log.d("err" + e);
                });
        } else {
           /*  this.userSession.isUserSignedIn() ?
                this.landing() :
                this.signIn(); */

        }
       // this.userSession = new UserSession({ appConfig: AppConfig.BLOCKSTACK_CONFIG });
        const username = this.userSession.loadUserData();
        this.log.d("username" + username);
        if (username) {
            //this.userIsSignedIn = true;
        }
    }

    public landing() {
        //this.userSession = new UserSession({ appConfig: AppConfig.BLOCKSTACK_CONFIG });
        this.userSession.redirectToSignIn();
        //this.userIsSignedIn = true;
    }


    public signOut(event) {
       // this.bs.signUserOut();
    }
}
