import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { AuthenticationService } from 'services/authentication.service';
import { ChatService } from 'services/chat.service';

@Component({
  selector: 'app-dialog-edit-members',
  templateUrl: './dialog-edit-members.component.html',
  styleUrls: ['./dialog-edit-members.component.scss']
})
export class DialogEditMembersComponent {
  dialogEditMembersRef: MatDialogRef<DialogEditMembersComponent>;
  constructor(
    public chatService: ChatService,
    public authService: AuthenticationService,
    private dialogRef: MatDialogRef<DialogEditMembersComponent>
    ) {
  }

  closeRedirectAddMember() {
    this.dialogRef.close(true);
  }

  isCurrentUser(user):boolean{
    return user === this.authService.getUid() ? true : false;
  }
}
