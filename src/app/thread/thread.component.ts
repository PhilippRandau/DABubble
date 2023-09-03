import { Component, ElementRef, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { AuthenticationService } from 'services/authentication.service';
import { FirestoreThreadDataService } from 'services/firestore-thread-data.service';
import { DialogEditCommentComponent } from '../dialog-edit-comment/dialog-edit-comment.component';
import { MatDialog } from '@angular/material/dialog';
import { DialogDeleteCommentComponent } from '../dialog-delete-comment/dialog-delete-comment.component';
import { EmojiService } from '../../services/emoji.service';
import { MessagesService } from 'services/messages.service';
import { ChatService } from 'services/chat.service';
import { UploadService } from 'services/upload.service';
import { ReactionBubbleService } from 'services/reaction-bubble.service';
import { ProfileService } from 'services/profile.service';
import { ChannelService } from 'services/channel.service';



@Component({
  selector: 'app-thread',
  templateUrl: './thread.component.html',
  styleUrls: ['./thread.component.scss'],
})
export class ThreadComponent implements OnInit {



  @ViewChild('messageTextarea') messageTextarea: ElementRef;
  @ViewChild('picker', { static: false }) picker: ElementRef;
  emoji_exist: boolean;
  react_user: string = 'test'
  comment_value: string = ''
  picker_index: number
  response: string = 'Antwort'
  channel_message = {
    emoji_data: []
  }
  emoji_data = []
  comment_index: number;
  emoji_index: number;
  hovered_emoji: boolean = false
  edit_comment: boolean = false;
  edit_comment_index: number;
  open_attachment_menu: boolean;
  uploadProgress: number = 0;


  constructor(
    public authService: AuthenticationService,
    public fsDataThreadService: FirestoreThreadDataService,
    public emojiService: EmojiService,
    public dialog: MatDialog,
    public msgService: MessagesService,
    public chatService: ChatService,
    public uploadService: UploadService,
    public reactionBubbleService: ReactionBubbleService,
    public profileService: ProfileService,
    public channelService: ChannelService
  ) { }

  @Output() threadClose = new EventEmitter<boolean>();
  selectedEmoji: string
  emojiPicker_open: boolean = false;


  async ngOnInit(): Promise<void> {
    document.body.addEventListener('click', this.bodyClicked);
    this.fsDataThreadService.getMessages()
    await this.getAllUsers()
  }


  closeThread(value: boolean) {
    this.threadClose.emit(value)
    this.fsDataThreadService.thread_open = false
  }


  openEmojiPicker(i: number) {
    this.picker_index = i
    this.emojiPicker_open = true
  }


  addEmojiInThread($event: any, i: number) {
    let array = this.fsDataThreadService.comments
    let user = this.authService.userData.uid
    this.emojiPicker_open = false
    this.fsDataThreadService.comments = this.emojiService.addEmoji($event, i, array, user)
    this.fsDataThreadService.updateData()
  }


  addOrRemoveEmojIinThread(i: number, j: number) {
    this.fsDataThreadService.current_changed_index = i
    let array = this.fsDataThreadService.comments
    let user = this.authService.userData.uid
    this.hovered_emoji = false
    this.fsDataThreadService.comments = this.emojiService.addOrRemoveEmoji(i, j, array, user)
    this.fsDataThreadService.updateData()
  }


  bodyClicked = () => {
    if (this.emojiPicker_open == true) this.emojiPicker_open = false;
    if (this.edit_comment == true) this.edit_comment = false;
    if (this.chatService.open_users == true) {
      this.chatService.open_users = false;
      this.getAllUsers()
    }
    if (this.open_attachment_menu == true) this.open_attachment_menu = false
  };


  stopPropagation(event: Event) {
    event.stopPropagation();
  };


  async postComment() {
    if (this.uploadService.upload_array.file_name.length > 0) await this.uploadService.prepareUploadfiles()
    if (this.comment_value.length > 0 || this.uploadService.upload_array.file_name.length > 0) {
      let time_stamp = new Date()
      let comment_data = {
        comment: this.comment_value,
        modified_comment: this.chatService.modifyMessageValue(this.comment_value),
        time: time_stamp,
        uid: this.authService.getUid(),
        emoji_data: [],
        text_edited: false,
        uploaded_files: this.uploadService.upload_array
      }
      setTimeout(() => this.fsDataThreadService.saveThread(comment_data), 500);
      this.comment_value = ''
      if (this.fsDataThreadService.comments?.length > 1) this.response = 'Antworten'
      if (this.fsDataThreadService.comments?.length < 2) this.response = 'Antwort'
      setTimeout(() => this.uploadService.emptyUploadArray(), 500);
    }
  }


  addEmojitoTextarea($event: any) {
    this.emojiPicker_open = false
    let unicodeCode: string = $event.emoji.unified
    let emoji = String.fromCodePoint(parseInt(unicodeCode, 16));
    this.comment_value += emoji
  }


  checkIfEmojiExistinMessage($event: any) {
    if (this.channel_message.emoji_data.length == 0) return
    this.channel_message.emoji_data.forEach(element => {
      if (element.emoji == $event.emoji.colons) {
        element.count += 1
      }
    });
  }


  addEmojiToMessage($event: any) {
    this.emojiPicker_open = false
    this.emoji_exist = false
    this.checkIfEmojiExistinMessage($event)
    if (!this.emoji_exist) {
      let emoji_data = {
        emoji: $event.emoji.colons,
        count: 1,
        react_users: [this.authService.userData.uid]
      }
      this.channel_message.emoji_data.push(emoji_data)
    }
  }


  openEditCommentMenu(i: number) {
    this.edit_comment = true
    this.edit_comment_index = i
  }


  openEditComment(i: number) {
    this.edit_comment = false;
    const dialogRef = this.dialog.open(DialogEditCommentComponent, {
      data: { comment: this.fsDataThreadService.comments[i].comment },
      panelClass: 'my-dialog'
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.fsDataThreadService.comments[i].comment = result;
        this.fsDataThreadService.comments[i].modified_comment = this.chatService.modifyMessageValue(result)
        this.fsDataThreadService.comments[i].text_edited = true
        this.fsDataThreadService.updateData()
      }
    });
  }


  openEditMessage() {
    this.edit_comment = false;
    const dialogRef = this.dialog.open(DialogEditCommentComponent, {
      data: { comment: this.fsDataThreadService.current_chat_data.chat_message },
      panelClass: 'my-dialog'
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.fsDataThreadService.current_chat_data.chat_message = result;
        this.fsDataThreadService.current_chat_data.chat_message_edited = true
        this.msgService.saveEditedMessageFromThread(this.fsDataThreadService.current_chat_data)
      }
    });
  }


  openDeleteComment(i: number) {
    this.edit_comment = false;
    const dialogRef = this.dialog.open(DialogDeleteCommentComponent, {
      data: { comment: this.fsDataThreadService.comments[i].comment },
      panelClass: 'my-dialog'
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result || result.length == 0) {
        this.fsDataThreadService.comments.splice(i, 1)
        this.fsDataThreadService.fake_array.length = this.fsDataThreadService.comments.length
        this.fsDataThreadService.updateData()
      }
    });
  }


  openDeleteMessage() {
    this.edit_comment = false;
    this.msgService.openDeleteMessage(this.fsDataThreadService.direct_chat_index, this.fsDataThreadService.current_chat_data)
  }


  showReactUsers(i: number, j: number) {
    if (this.hovered_emoji == false) this.hovered_emoji = true
    this.comment_index = i
    this.emoji_index = j
  }


  closeShowReactUsers() {
    if (this.hovered_emoji == true) this.hovered_emoji = false
  }


  openUsers() {
    this.getAllUsers()
    this.chatService.open_users = true
  }


  getImageUrl(uid: string): string {
    const user = this.authService.all_users.find(element => element.uid === uid);
    return user.avatar
  }


  getUserName(uid: string) {
    const user = this.authService.all_users.find(element => element.uid === uid);
    return user.user_name
  }


  getUserEmail(uid: string) {
    const user = this.authService.all_users.find(element => element.uid === uid);
    return user.email
  }


  openAttachmentMenu() {
    this.open_attachment_menu = true
    this.uploadService.chat_section = 'thread'
  }


  addOrRemoveEmojisOnDirectChatMessage(i: number, j: number) {
    this.hovered_emoji = false
    let chatMessages = this.chatService.directChatMessages;
    let user = this.authService.userData.uid;
    this.msgService.emoji_data = this.emojiService.addOrRemoveEmoji(i, j, chatMessages, user)[i]['emoji_data'];
    this.msgService.updateMessagesReactions(this.fsDataThreadService.current_chat_data);
  }


  addEmojiInDirectMessage($event: any, i: number) {
    let chatMessages = this.chatService.directChatMessages;
    let user = this.authService.userData.uid;
    this.emojiPicker_open = false;
    this.msgService.emoji_data = this.emojiService.addEmoji($event, i, chatMessages, user)[i]['emoji_data'];
    this.msgService.updateMessagesReactions(this.fsDataThreadService.current_chat_data);
  }


  textChanged(text: string) {
    this.comment_value = this.chatService.textChanged(text)
  }


  addUserToTextarea(i: number) {
    this.messageTextarea.nativeElement.focus();
    this.comment_value = this.chatService.addUserToTextarea(i, this.comment_value)
  }


  async getAllUsers() {
    this.chatService.at_users = await this.authService.getAllUsers();
  }
}
