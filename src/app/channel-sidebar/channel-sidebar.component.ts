import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewChecked, AfterViewInit } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { AddChannelComponent } from '../dialog-add-channel/add-channel.component';
import { Subscription } from 'rxjs';
import { NewMsgService } from 'services/new-msg.service';
import { ChannelService } from 'services/channel.service';
import { ChatService } from 'services/chat.service';
import { MessagesService } from 'services/messages.service';
import { AuthenticationService } from 'services/authentication.service';
import { FirestoreThreadDataService } from 'services/firestore-thread-data.service';

@Component({
  selector: 'app-channel-sidebar',
  templateUrl: './channel-sidebar.component.html',
  styleUrls: ['./channel-sidebar.component.scss'],
})
export class ChannelSidebarComponent implements OnInit, OnDestroy {

  @ViewChild('addChannel') public ElementEditChannelRef: ElementRef<HTMLDivElement>;
  addChannelRef: MatDialogRef<AddChannelComponent>;
  addChannelOpen: boolean = false;

  channelsVisible: boolean = true;
  dmsVisible: boolean = true;
  workspaceVisible: boolean = true;
  openNewMsg: boolean = false;
 
  private authorizedChannelsSubscription: Subscription;
  private currentUserSubscription: Subscription;
  private newChannelIdSubscription: Subscription;

  authorizedChannels: any[] = [];
  currentValue: string;

  constructor(
    public authService: AuthenticationService,
    public dialog: MatDialog,
    public newMsgService: NewMsgService,
    public channelService: ChannelService,
    public chatService: ChatService,
    public msgService: MessagesService,
    public fsDataThreadService: FirestoreThreadDataService,
  ) {
    this.newChannelIdSubscription = this.channelService.createtChannelId$.subscribe((newValue) => {
      this.currentValue = newValue;
      if (this.currentValue) this.openChannel(this.currentValue);
    });
  }


  async ngOnInit() {
    await this.authService.waitUntilAuthInitialized();
    
    this.currentUserSubscription = this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.chatService.currentUser_id = user.uid;
      }
    });

    this.authorizedChannelsSubscription = this.channelService.authorizedChannels.subscribe(channels => {
      this.channelService.channels = channels;
    });
    
    await this.authService.usersPromise;
    await this.chatService.loadChats();
    this.chatService.initOwnChat();
    console.log('finished');
    
  }


  ngOnDestroy() {
    // if (this.authorizedChannelsSubscription) this.authorizedChannelsSubscription.unsubscribe();
    // if (this.currentUserSubscription) this.currentUserSubscription.unsubscribe();
    // this.newChannelIdSubscription.unsubscribe();
    this.authorizedChannelsSubscription.unsubscribe();
    this.currentUserSubscription.unsubscribe();
    this.newChannelIdSubscription.unsubscribe();
  }


  toggleChannels() {
    this.channelsVisible = !this.channelsVisible;
  }


  toggleDms() {
    this.dmsVisible = !this.dmsVisible;
  }


  toggleWorkspace() {
    this.workspaceVisible = !this.workspaceVisible;
  }


  openAddChannel() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.panelClass = 'add-channel-dialog';
    this.addChannelRef = this.dialog.open(AddChannelComponent, dialogConfig);
    this.addChannelOpen = true;
    this.addChannelRef.afterClosed().subscribe(() => {
      this.addChannelOpen = false;
    });
  }

  
  sendNewMsg() {
    this.chatService.currentChatSection = 'noChatSectionSelected';
    this.chatService.currentChatID = 'noChatSelected';
    this.chatService.messageToPlaceholder = 'Nachricht an ...'
    this.chatService.textAreaMessageTo();
    this.msgService.emptyMessageText();
    this.toggleNewMsgComponent();
  }


  toggleNewMsgComponent() {
    this.newMsgService.openNewMsg = !this.newMsgService.openNewMsg;
  }


  checkIfSameChatID(userReceiverID: string) {
    return this.chatService.currentChatID !== userReceiverID;
  }


  async openChat(chat: { chat_ID: string; }) {
    if (this.newMsgService.openNewMsg) this.toggleNewMsgComponent();
    if (this.chatService.currentChatID !== chat.chat_ID) {
      this.chatService.currentChatSection = 'chats';
      this.chatService.currentChatID = chat.chat_ID;
      this.msgService.emptyMessageText();
      try {
        this.chatService.currentChatData = chat;
        this.chatService.textAreaMessageTo();
        this.msgService.getMessages();
        this.fsDataThreadService.thread_open = false;
      } catch (error) {
        console.error("Fehler bei öffnen des Chats: ", error);
      }
    }
  }


  isCurrentUserChat(chat: { chat_Member_IDs: any[]; }): boolean {
    return chat.chat_Member_IDs[0] === chat.chat_Member_IDs[1] ? true : false;
  }


  async openChannel(channelID: string) {
    if (this.newMsgService.openNewMsg) this.toggleNewMsgComponent();
    if (this.chatService.currentChatID !== channelID) {
      this.chatService.currentChatSection = 'channels';
      this.chatService.currentChatID = channelID;
      this.channelService.currentChannelID = channelID
      this.msgService.emptyMessageText();
      try {
        this.chatService.getCurrentChatData();
        this.chatService.textAreaMessageTo();
        this.channelService.loadCurrentChannel()
        await this.msgService.getMessages();
        this.fsDataThreadService.thread_open = false;
      } catch (error) {
        console.error("Fehler bei öffnen des Channels: ", error);
      }
    }
  }

}


