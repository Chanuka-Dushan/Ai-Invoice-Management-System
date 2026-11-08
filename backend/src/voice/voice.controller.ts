import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VoiceService } from './voice.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CompanyAccessGuard } from '../common/guards/company-access.guard';

@UseGuards(JwtAuthGuard, CompanyAccessGuard)
@Controller('voice')
export class VoiceController {
  constructor(private readonly voiceService: VoiceService) {}

  @Post('transcribe')
  @UseInterceptors(
    FileInterceptor('audio', {
      limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max audio
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/(audio|ogg|webm|wav|mp3|m4a|mpeg)/)) {
          return cb(new BadRequestException('Invalid audio file format. Please upload WAV, MP3, WebM, or M4A.'), false);
        }
        cb(null, true);
      },
    }),
  )
  async transcribeAudio(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No audio file provided.');
    }
    const transcription = await this.voiceService.transcribeAudio(file);
    return { transcription };
  }
}

