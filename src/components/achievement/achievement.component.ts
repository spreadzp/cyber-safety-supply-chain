import { Component, Input } from "@angular/core";

/**
 *
 *
 * @export
 * @class AchievementComponent
 */
@Component({
    selector: "achievement",
    templateUrl: "achievement.component.html",
    styles: ["achievement.component.scss"]
 })

export class AchievementComponent {

    @Input()
    public isEmpty = false;

    @Input()
    public achievementInfo: AchievementComponent;

    @Input()
    public isBig = false;

    
}
