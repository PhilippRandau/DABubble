import { ElementRef, Injectable } from '@angular/core';
import firebase from 'firebase/compat/app';
import { doc, getFirestore, updateDoc, collection, addDoc, orderBy, query, getDocs, deleteDoc, getDoc, onSnapshot, setDoc } from '@angular/fire/firestore';
import { getAuth } from '@angular/fire/auth';
import { ChatService } from './chat.service';
import { AuthenticationService } from './authentication.service';
import { EmojiService } from './emoji.service';
import { Subject } from 'rxjs/internal/Subject';
import { NewMsgService } from './new-msg.service';
import { UploadService } from './upload.service';
import { ChannelService } from './channel.service';
import { GeneralFunctionsService } from './general-functions.service';

@Injectable({
  providedIn: 'root'
})
export class MessagesService {
  db = getFirestore();
  previousMessageDate = null;
  messageText: string = '';
  messageID: string = '';
  editMessageText = false;
  readyToSend: boolean = false;
  messageDateRange: string = '';
  emoji_data = [];
  messageIndex: number = null;
  private scrollSubject = new Subject<void>();
  answers_count: any;
  time: any;
  upload_array;


  constructor(
    public chatService: ChatService,
    public authService: AuthenticationService,
    public emojiService: EmojiService,
    public newMsgService: NewMsgService,
    public genFunctService: GeneralFunctionsService,

  ) {
  }


  checkIfEmpty() {
    if (this.messageText.length && this.chatService.currentChatID !== 'noChatSelected' || this.newMsgService.openNewMsg) {
      this.readyToSend = true;
    } else {
      this.readyToSend = false;
    }
  }

  async newMessage() {
    let time_stamp = new Date();
    const customMessageID = await this.genFunctService.generateCustomFirestoreID();

    await setDoc(doc(collection(this.db, this.chatService.currentChatSection, this.chatService.currentChatID, 'messages'), customMessageID), {
      chat_message: this.messageText,
      user_Sender_ID: this.authService.userData.uid,
      user_Sender_Name: this.authService.userData.user_name,
      created_At: time_stamp,
      chat_message_edited: false,
      emoji_data: [],
      modified_message: this.chatService.modifyMessageValue(this.messageText),
      answers: 0,
      last_answer: '',
      uploaded_files: this.upload_array,
      message_ID: customMessageID
    }).then(() => {
      this.messageText = '';
    });
  }


  async saveNumberOfAnswers(id: string) {
    await this.getNumberOfAnswers(id)
    const messageRef = doc(this.db, this.chatService.currentChatSection, this.chatService.currentChatID, 'messages', id);
    const data = {
      answers: this.answers_count,
      last_answer: this.time
    };
    updateDoc(messageRef, data);
  }


  async getNumberOfAnswers(id: string) {
    const docRef = doc(this.db, "threads", id);
    const docSnap = await getDoc(docRef);
    this.answers_count = docSnap.data().comments.length
    if (this.answers_count > 0) this.time = docSnap.data().comments[this.answers_count - 1].time.seconds
    else this.time = 0
  }


  // async getNewMessage() {
  //   const chatMessagesRef = collection(this.db, this.chatService.currentChatSection, this.chatService.currentChatID, 'messages');
  //   const docDirectChatMessagesSnapshot = await getDocs(query(chatMessagesRef, orderBy("created_At", "asc")));
  //   const latestDocument = docDirectChatMessagesSnapshot.docs[docDirectChatMessagesSnapshot.docs.length - 1].data();
  //   this.chatService.directChatMessages.push(latestDocument);
  //   this.scrollToBottom();
  // }


  async getMessages() {
    this.emojiService.resetInitializedEmojiRef();
    this.chatService.directChatMessages = [];
    this.previousMessageDate === null;
    const chatMessagesRef = collection(this.db, this.chatService.currentChatSection, this.chatService.currentChatID, 'messages');
    const docDirectChatMessagesSnapshot = query(chatMessagesRef, orderBy("created_At", "asc"));
    onSnapshot(docDirectChatMessagesSnapshot, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const changedMessageData = change.doc.data();
        if (change.type === 'added') {
          this.chatService.directChatMessages.push(changedMessageData);
          console.log('added');
        } else if (change.type === 'modified') {
          console.log('modified');
          this.getChangedMessage(changedMessageData);

        } else if (change.type === 'removed') {
          console.log('removed');
          this.spliceMessage(changedMessageData);
        }
      });
    });
    this.scrollToBottom();
  }


  async getChangedMessage(changedMessageData) {
    const changedchatMessage = this.chatService.directChatMessages.find(chatMessage => chatMessage.message_ID === changedMessageData.message_ID);
    changedchatMessage.chat_message = changedMessageData.chat_message;
    changedchatMessage.modified_message = changedMessageData.modified_message;
    changedchatMessage.chat_message_edited = changedMessageData.chat_message_edited;
    changedchatMessage.emoji_data = changedMessageData.emoji_data;
    changedchatMessage.answers = changedMessageData.answers;
    changedchatMessage.last_answer = changedMessageData.last_answer;
    changedchatMessage.uploaded_files = changedMessageData.uploaded_files;
  }


  async spliceMessage(changedMessageData) {
    const index = this.chatService.directChatMessages.findIndex(chatMessage => chatMessage.message_ID === changedMessageData.message_ID);
    if (index !== -1) {
      this.chatService.directChatMessages.splice(index, 1);
    }
  }


  scrollToBottom() {
    setTimeout(() => {
      this.scrollSubject.next();
    }, 0);
  }


  get scrollObservable() {
    return this.scrollSubject.asObservable();
  }


  async editMessage(i: number, chatMessage) {
    this.messageIndex = i;
    this.messageID = chatMessage.message_ID;
    this.editMessageText = true;
    this.messageText = chatMessage.chat_message;
  }


  async saveEditedMessage() {
    try {
      const messageRef = doc(this.db, this.chatService.currentChatSection, this.chatService.currentChatID, 'messages', this.messageID);
      await updateDoc(messageRef, {
        chat_message: this.messageText,
        chat_message_edited: true,
        modified_message: this.chatService.modifyMessageValue(this.messageText),
      }).then(() => {
        this.messageText = '';
        this.editMessageText = false;

      });
    } catch (error) {
      console.error('Error editing message:', error);
    }
  }


  async saveEditedMessageFromThread(chat) {
    let id = chat.message_ID
    let message = chat.chat_message
    let edited = chat.chat_message_edited
    const messageRef = doc(this.db, this.chatService.currentChatSection, this.chatService.currentChatID, 'messages', id);
    await updateDoc(messageRef, {
      chat_message: message,
      chat_message_edited: edited
    })
  }


  async deleteMessage(i: number, chatMessage) {
    this.messageIndex = i;
    this.messageID = chatMessage.message_ID;
    try {
      const messageRef = doc(this.db, this.chatService.currentChatSection, this.chatService.currentChatID, 'messages', this.messageID);
      await deleteDoc(messageRef)
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  }





  getTimestampTime(timestamp) {
    const dateObj = timestamp.toDate();
    const hours = dateObj.getHours();
    const minutes = dateObj.getMinutes();
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} Uhr`;
  }


  async updateMessagesReactions(chatMessage) {
    const docRef = doc(this.db, this.chatService.currentChatSection, this.chatService.currentChatID, 'messages', chatMessage.message_ID);
    await updateDoc(docRef, {
      emoji_data: this.emoji_data,
    }).then(() => {
      console.log(chatMessage.message_ID);

    });
  }


  formatDate(timestamp): string {
    const date = timestamp.toDate();
    const now = new Date();

    if (date.toDateString() === now.toDateString()) {
      return 'Heute';
    } else {
      const options = { weekday: 'long', day: 'numeric', month: 'long' };
      return date.toLocaleDateString('de-DE', options);
    }
  }

  emptyMessageText() {
    this.messageText = '';
  }
}
