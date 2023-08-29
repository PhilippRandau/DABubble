import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { ChatService } from 'services/chat.service';
import { EmojiService } from 'services/emoji.service';
import { MessagesService } from 'services/messages.service';
import { NewMsgService } from 'services/new-msg.service';
import { FirestoreThreadDataService } from 'services/firestore-thread-data.service';
import { UploadService } from 'services/upload.service';
import { AuthenticationService } from 'services/authentication.service';

@Component({
  selector: 'app-channel-direct-send-message',
  templateUrl: './channel-direct-send-message.component.html',
  styleUrls: ['./channel-direct-send-message.component.scss']
})
export class ChannelDirectSendMessageComponent {

  @Input() inputValue: string;
  open_attachment_menu: boolean = false;
  @ViewChild('messageTextarea') messageTextarea: ElementRef;

  constructor(
    public authService: AuthenticationService,
    public chatService: ChatService,
    public msgService: MessagesService,
    public emojiService: EmojiService,
    public newMsgService: NewMsgService,
    public fsDataThreadService: FirestoreThreadDataService,
    public uploadService: UploadService,
  ) { }

  addEmojitoTextarea($event: any) {
    this.emojiService.addEmojitoTextarea($event)
    this.msgService.messageText += this.emojiService.textMessage;
    this.emojiService.textMessage = '';
    this.msgService.checkIfEmpty();
  }

  toggleEmojiPicker() {
    this.emojiService.emojiPicker_open = !this.emojiService.emojiPicker_open;
  }

  sendMsg(msg: string, channelOrUserInput: string) {
    msg = this.msgService.messageText;
    console.log(msg);
    this.newMsgService.addOrUpdateChat(msg, channelOrUserInput);
    this.msgService.messageText = '';
  }

  async openChannel(channelID) {
    if (this.newMsgService.newMsgComponentOpen) {
      this.newMsgService.toggleNewMsg();
      this.newMsgService.newMsgComponentOpen = !this.newMsgService.newMsgComponentOpen;
    }
    if (this.chatService.currentChatID !== channelID) {
      this.chatService.currentChatSection = 'channels';
      this.chatService.currentChatID = channelID;
      this.msgService.emptyMessageText();
      try {
        this.chatService.getCurrentChatData();
        this.chatService.textAreaMessageTo();
        this.msgService.getMessages();
        this.fsDataThreadService.thread_open = false;
      } catch (error) {
        console.error("Fehler bei öffnen des Channels: ", error);
      }
    }
  }



  public async onSendClick() {
    if (this.newMsgService.newMsgComponentOpen) {
      this.sendMsg(this.msgService.messageText, this.inputValue);
      this.openChannel(this.newMsgService.selectedChannelID)
    } else {
      
      if (this.uploadService.upload_array.file_name.length > 0) await this.uploadService.prepareUploadfiles();
      this.msgService.upload_array = this.uploadService.upload_array;
      console.log('uploadArray ' + this.uploadService.upload_array);
      debugger
      this.msgService.newMessage();
      setTimeout(() => this.uploadService.emptyUploadArray(), 500);
    }
  }


  stopPropagation(event: Event) {
    event.stopPropagation();
  };

  openAttachmentMenu() {
    this.open_attachment_menu = !this.open_attachment_menu;
    console.log(this.open_attachment_menu);
  }

  addUserToTextarea(i: number) {
    this.messageTextarea.nativeElement.focus();
    this.msgService.messageText = this.chatService.addUserToTextarea(i, this.msgService.messageText)
  }

  openUsers() {
    this.getAllUsers()
    this.chatService.open_users = true
  }

  async getAllUsers() {
    this.chatService.at_users = await this.authService.getAllUsers();
  }
}
