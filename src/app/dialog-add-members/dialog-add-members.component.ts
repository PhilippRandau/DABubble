// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-dialog-add-members',
//   templateUrl: './dialog-add-members.component.html',
//   styleUrls: ['./dialog-add-members.component.scss']
// })
// export class DialogAddMembersComponent {
//   inputSearchUser: string = '';
//   choosedUser: boolean = false;

//   selectUser() {
//     this.choosedUser = !this.choosedUser;
//     this.inputSearchUser = '';
//   }

//   addNewMember() {
//     console.log('newMemberAdded');
//     this.choosedUser = false;
//   }

//   clearInputName(){
//     console.log('clearInputName');
//     this.choosedUser = false;
//   }
// }
import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from 'services/authentication.service';
import { ChannelService } from 'services/channel.service';
import { MatDialogRef } from '@angular/material/dialog';
import { ChatService } from 'services/chat.service';
import { MessagesService } from 'services/messages.service';
import { UploadService } from 'services/upload.service';


@Component({
  selector: 'app-dialog-add-members',
  templateUrl: './dialog-add-members.component.html',
  styleUrls: ['./dialog-add-members.component.scss']
})
export class DialogAddMembersComponent implements OnInit {
  inputSearchUser: string = '';
  choosedUser: boolean = false;
  selectedUsers = [];
  users: any[] = [];
  filteredUsers: any
  currentChannel: string = '';

  constructor(
    private authService: AuthenticationService,
    public channelService: ChannelService,
    public dialogRef: MatDialogRef<DialogAddMembersComponent>,
    public chatService: ChatService,
    public messageService: MessagesService,
    public uploadService: UploadService
  ) { }

  async ngOnInit(): Promise<void> {
    this.users = await this.filterUserAllreadyAssigned()
  }


  filterUsers() {
    if (this.inputSearchUser.length > 0) {
      this.filteredUsers = this.users.filter(user =>
        user.user_name.toLowerCase().startsWith(this.inputSearchUser.toLowerCase())
      );
    } else {
      this.filteredUsers = this.users;
      if (this.filteredUsers.length === 0) console.log('kein username gefunden');

    }
  }


  selectUser(user) {
    this.choosedUser = true;
    this.inputSearchUser = user.user_name;
    this.selectedUsers.push(user);
  }


  addNewMember() {
    this.selectedUsers.forEach(user => {
      this.channelService.addUserToChannel(this.chatService.currentChatData.channelName, user.uid);
      this.sendAddMemberMessage(user.user_name);
    });
    this.selectedUsers = [];
    this.choosedUser = null;
    this.inputSearchUser = '';
    this.dialogRef.close();
  }


  clearInputName(userToRemove) {
    this.inputSearchUser = ''
    this.choosedUser = false;
    this.selectedUsers = this.selectedUsers.filter(user => user.uid !== userToRemove.uid);
  }


  async filterUserAllreadyAssigned(): Promise<any> {
    let users = await this.authService.getAllUsers();
    this.channelService.currentChannelData.assignedUsers.forEach((assignedUser: any) => {
      let user = users.find(element => element.uid === assignedUser)
      let index = users.indexOf(user)
      users.splice(index, 1)
    });
    return users
  }


  sendAddMemberMessage(user: string) {
    this.uploadService.checkForUpload()
    this.messageService.messageText = user + ' ist #' + this.channelService.currentChannelData.channelName + ' beigetreten.'
    this.messageService.newMessage()
  }
}
