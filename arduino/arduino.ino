#include <SPI.h>
#include <MFRC522.h>

#define SS_PIN 10
#define RST_PIN 9
MFRC522 mfrc522(SS_PIN, RST_PIN);  // Create MFRC522 instance.

/* Define available CmdMessenger commands */
enum {
    open_card,
    get_type,
    get_uid,
    authenticate,
    read_block,
    write_block,
    increment,
    decrement,
    set_as_value_block,
    error
};

#define MAX_LEN 100
#define ATTEMPTS 10

/* Initialize CmdMessenger -- this should match PyCmdMessenger instance */
const int BAUD_RATE = 9600;
char command_buffer[MAX_LEN];
int buffer_index = 0;
bool is_command = false;
int cmd_id;
MFRC522::MIFARE_Key key;
byte buffer[30];
byte size = sizeof(buffer);
MFRC522::Uid newUid;
int authenticated = -1;

void setup() {
    Serial.begin(9600);  // Initialize serial communications with the PC
    while (!Serial);    // Do nothing if no serial port is opened (added for Arduinos based on ATMEGA32U4)
    SPI.begin();    // Init SPI bus
    mfrc522.PCD_Init(); 
}

void loop() {
    if(is_command){
      char* param;
      MFRC522::StatusCode status;
      byte blockAddr;
      long delta;

      cmd_id = get_cmd_id();
      
      switch(cmd_id){
        case open_card:
        int s;
        int a;
        a = 0;
        do{
          s = 0;
          mfrc522.PICC_HaltA();
          // Stop encryption on PCD
          mfrc522.PCD_StopCrypto1();
          s += ((int) !mfrc522.PICC_IsNewCardPresent());
          //s = 0;
          s += ((int) !mfrc522.PICC_ReadCardSerial()) * 2;
          a++;
        }while(s != 0 && a < ATTEMPTS);
        if(s == 0){
          Serial.print(F("0,"));
          Serial.print(mfrc522.PICC_GetType(mfrc522.uid.sak));
          Serial.print(F(","));
          dump_byte_array(mfrc522.uid.uidByte, mfrc522.uid.size);
          Serial.println();
        }
        else {
          Serial.println(s);
        }
        break;
        case get_type:
          //MFRC522::PICC_Type piccType = ;
          Serial.print(F("0,"));
          Serial.println(mfrc522.PICC_GetType(mfrc522.uid.sak));
          break;
        case get_uid:
          Serial.print(F("0,"));
          dump_byte_array(mfrc522.uid.uidByte, mfrc522.uid.size);
          Serial.println();
          break;
        case authenticate:
          //2:96,5,255,255,255,255,255,255;
          int keyType;
          byte trailerBlock;
          param = get_next_param();
          keyType = atoi(param);
          param = get_next_param();
          blockAddr = atoi(param);
          trailerBlock = getTrailerBlock(blockAddr);
          for (byte i = 0; i < 6; i++) {
              param = get_next_param();
              key.keyByte[i] = atoi(param);
          }
          //MFRC522::PICC_CMD_MF_AUTH_KEY_A
          status = (MFRC522::StatusCode) mfrc522.PCD_Authenticate(keyType, trailerBlock, &key, &(mfrc522.uid));
          /*if(status == 0){
            authenticated = trailerBlock;
          }
          else{
            authenticated = -1;
          }*/
          Serial.println(status);
          break;
       case read_block:
          param = get_next_param();
          blockAddr = atoi(param);
          read(blockAddr);
          break;
        case write_block:
          param = get_next_param();
          blockAddr = atoi(param);
          int blockSize;
          param = get_next_param();
          blockSize = atoi(param);
          byte* dataBlock;
          dataBlock = (byte*) malloc(blockSize * sizeof(byte));
          for(int i = 0; i < blockSize; i++){
              param = get_next_param();
              dataBlock[i] = lowByte(atoi(param));
          }
          status = (MFRC522::StatusCode) mfrc522.MIFARE_Write(blockAddr, dataBlock, blockSize);
          Serial.println(status);
          break;
        case set_as_value_block:
          param = get_next_param();
          blockAddr = atoi(param);
          status = formatValueBlock(blockAddr);
          if(status == MFRC522::STATUS_OK){
            read(blockAddr);
          }
          else{
            Serial.println(status);
          }
          break;
        case increment:
          param = get_next_param();
          blockAddr = atoi(param);
          param = get_next_param();
          delta = atol(param);
          //Serial.println(blockAddr);
          //Serial.println(delta);
          status = (MFRC522::StatusCode) mfrc522.MIFARE_Increment(blockAddr, delta);
          if(status == MFRC522::STATUS_OK){
              status = mfrc522.MIFARE_Transfer(blockAddr);
              if(status == MFRC522::STATUS_OK){
                 read(blockAddr);
              }
              else{
                Serial.println(status);
              }
          }
          else{
              Serial.println(status);
          }
          break;
        case decrement:
          param = get_next_param();
          blockAddr = atoi(param);
          param = get_next_param();
          delta = atol(param);
          status = (MFRC522::StatusCode) mfrc522.MIFARE_Decrement(blockAddr, delta);
          if(status == MFRC522::STATUS_OK){
              status = mfrc522.MIFARE_Transfer(blockAddr);
              if(status == MFRC522::STATUS_OK){
                 read(blockAddr);
              }
              else{
                Serial.println(status);
              }
          }
          else{
              Serial.println(status);
          }
          break;
        default:
          Serial.println(F("unknow_command"));
          break;
      }
      buffer_index = 0;
      is_command = false;
      
    }
    else{
      while(Serial.available() > 0){
        command_buffer[buffer_index] = Serial.read();
        //Serial.print((char)buffer[buffer_index]);
        buffer_index++;
        if(command_buffer[buffer_index - 1] == ';'){
          is_command = true;
          command_buffer[buffer_index] = 0;
          break;
        }
      }
    }
    
}

int get_cmd_id(){
  for(buffer_index = 0; buffer_index < MAX_LEN; buffer_index++){
    if(command_buffer[buffer_index] == ':'){
      command_buffer[buffer_index] = '\0';
      break;
    }
  }
  int cmd_id = atoi(command_buffer);
  command_buffer[buffer_index] = ':';
  return cmd_id;
}

char* get_next_param(){
  buffer_index++;
  int start_index = buffer_index;
  if(command_buffer[buffer_index] == '\0'){
    command_buffer[buffer_index] = ',';
  }
  while(buffer_index < MAX_LEN && command_buffer[buffer_index] != ',' && command_buffer[buffer_index] != ';'){
    buffer_index++;
  }
  if(command_buffer[buffer_index] == ',' || command_buffer[buffer_index] == ';'){
      command_buffer[buffer_index] = '\0';
  }
  return (command_buffer + start_index);
}

/**
 * Helper routine to dump a byte array as hex values to Serial.
 */
void dump_byte_array(byte *buffer, byte bufferSize) {
    for (byte i = 0; i < bufferSize; i++) {
        //Serial.print(buffer[i] < 0x10 ? "0" : "");
        //Serial.print(buffer[i], HEX);
        if(i > 0){
          Serial.print(F(","));
        }
        Serial.print(buffer[i]);
    }
}

MFRC522::StatusCode formatValueBlock(byte blockAddr) {
    MFRC522::StatusCode status;
    status = mfrc522.MIFARE_Read(blockAddr, buffer, &size);
    if (status != MFRC522::STATUS_OK) {
        return status;
    }

    if (isValueBlock(buffer)) {
        return MFRC522::STATUS_OK;
    }
    else {
        byte valueBlock[] = {
            0, 0, 0, 0,
            255, 255, 255, 255,
            0, 0, 0, 0,
            blockAddr, ~blockAddr, blockAddr, ~blockAddr };
        status = mfrc522.MIFARE_Write(blockAddr, valueBlock, 16);
        return status;
    }
}

void read(byte blockAddr){
  MFRC522::StatusCode status = (MFRC522::StatusCode) mfrc522.MIFARE_Read(blockAddr, buffer, &size);
  Serial.print(status);
  Serial.print(F(","));
  long value;
  Serial.print(isValueBlock(buffer));
  value = (long(buffer[3])<<24) | (long(buffer[2])<<16) | (long(buffer[1])<<8) | long(buffer[0]);
  Serial.print(F(","));
  Serial.print(value);
  Serial.print(F(","));
  dump_byte_array(buffer, 16); 
  Serial.println();
}

bool isValueBlock(byte *buffer){
  return     ((buffer[0] == (byte)~buffer[4])
        &&  (buffer[1] == (byte)~buffer[5])
        &&  (buffer[2] == (byte)~buffer[6])
        &&  (buffer[3] == (byte)~buffer[7])

        &&  (buffer[0] == buffer[8])
        &&  (buffer[1] == buffer[9])
        &&  (buffer[2] == buffer[10])
        &&  (buffer[3] == buffer[11])

        &&  (buffer[12] == (byte)~buffer[13])
        &&  (buffer[12] ==        buffer[14])
        &&  (buffer[12] == (byte)~buffer[15]));
}

byte getTrailerBlock(byte blockAddr){
    MFRC522::PICC_Type type = mfrc522.PICC_GetType(mfrc522.uid.sak);
    switch(type){
        case MFRC522::PICC_TYPE_MIFARE_1K:
        return blockAddr + 3 - (blockAddr % 4);
        break;
        case MFRC522::PICC_TYPE_MIFARE_4K:
        //32 sectors with 4 bytes
        if(blockAddr < 128){  // 32 * 4 
          return blockAddr + 3 - (blockAddr % 4);
        }
        //8 sectors with 16 bytes
        else{
          byte b = blockAddr - 128;
          return 128 + b + 15 - (b % 16);
        }
        break;
    }
}

