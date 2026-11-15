import { z } from 'zod';
import { ensureLibrary } from '../library';
import { copyInto, importDocument, parseCourseware } from '../documents';
import { questionSchema } from '../../shared/types';
import { readTranscript } from '../transcript';
import type { ApplicationContext } from '../main';
import { defineHandler } from './handler';
export function createCoursesHandler(
  context: Pick<
    ApplicationContext,
    'db' | 'directory' | 'flows' | 'idSchema' | 'job' | 'jobs' | 'libraryRoot' | 'pick' | 'root'
  >,
) {
  const { db, directory, flows, idSchema, job, jobs, libraryRoot, pick, root } = context;
  return defineHandler((object) => {
    const id = () => z.string().uuid().parse(object.id),
      courseId = () => z.string().uuid().parse(object.courseId);

    return {
      courses: async () => db.courses(),
      'lecture:delete': async () => {
        if (jobs.size) throw new Error('请等待当前任务完成后再删除课次');
        if (object.confirmed !== true) throw new Error('请先确认删除课次');
        db.lecture(id());
        db.db.transaction(() => {
          db.db.prepare('DELETE FROM messages WHERE lecture_id=?').run(id());
          db.db.prepare('DELETE FROM lectures WHERE id=?').run(id());
        })();
        db.db.pragma('wal_checkpoint(FULL)');
        return true;
      },
      'course:delete': async () => {
        if (jobs.size) throw new Error('请等待当前任务完成后再删除课程');
        if (object.confirmed !== true) throw new Error('请先确认删除课程');
        db.course(id());
        db.db.prepare('DELETE FROM courses WHERE id=?').run(id());
        db.db.pragma('wal_checkpoint(FULL)');
        return true;
      },
      'course:create': async () => {
        const course = db.createCourse(z.string().min(1).max(200).parse(object.name));
        await ensureLibrary(libraryRoot, [course.name]);
        return course;
      },
      'course:detail': async () => db.detail(id()),
      sessions: async () => db.sessions(),
      'session:create': async () => {
        const cid = courseId(),
          lecture = object.lectureId ? db.lecture(idSchema.parse(object.lectureId)) : undefined;
        if (lecture && lecture.course_id !== cid) throw new Error('课次不属于当前课程');
        return db.createSession(cid, lecture?.title, lecture?.id);
      },
      'session:delete': async () => {
        if (jobs.size) throw new Error('请等待当前任务完成后再删除会话');
        if (object.confirmed !== true) throw new Error('请先确认删除会话');
        return db.deleteSession(courseId(), id());
      },
      pick: async () =>
        pick(
          z.enum(['transcript', 'document', 'srt', 'courseware']).parse(object.kind),
          object.courseId ? idSchema.parse(object.courseId) : undefined,
        ),
      'files:add': async () => {
        const course = courseId();
        db.course(course);
        const paths = z.array(z.string()).max(50).parse(object.paths),
          kind = z.enum(['senior_notes', 'past_exam']).parse(object.kind);
        const added = [];
        for (const path of paths) {
          const file = await importDocument(
            root,
            course,
            kind,
            path,
            await directory(kind === 'past_exam' ? '历年卷' : '笔记', course),
          );
          db.insertFile(file);
          added.push(file);
        }
        return added;
      },
      'files:remove': async () => {
        db.removeFile(courseId(), id());
        return true;
      },
      'questions:split': async () =>
        job('exam:' + id(), (signal) => flows.splitExam(courseId(), id(), signal)),
      'questions:save': async () => {
        db.saveQuestions(courseId(), questionSchema.array().parse(object.questions));
        return true;
      },
      'lecture:create': async () => {
        const course = courseId();
        db.course(course);
        const source = z.string().min(1).parse(object.transcriptPath),
          ppt = z.string().parse(object.pptPath || ''),
          original = await readTranscript(source);
        const parsed = ppt ? await parseCourseware(ppt) : { text: '', needsOcr: false };
        if (parsed.needsOcr) throw new Error('课件是扫描 PDF，请使用 PPTX 或文字 PDF');
        const lecture = db.createLecture(
          course,
          z.string().min(1).max(200).parse(object.title),
          '',
          ppt
            ? await copyInto(root, course, ppt, 'courseware', await directory('PPT', course))
            : '',
          parsed.text,
        );
        const path = await copyInto(
          root,
          course,
          source,
          'transcripts',
          await directory('语音原文', course),
        );
        db.db
          .prepare(
            'UPDATE lectures SET transcript_path=?,transcript_text=?,time_estimated=?,status=? WHERE id=?',
          )
          .run(path, original.text, original.estimated ? 1 : 0, '待校订', lecture.id);
        return db.lecture(lecture.id);
      },
      'lecture:transcript': async () => {
        const lecture = db.lecture(id()),
          source = z.string().min(1).parse(object.path),
          original = await readTranscript(source),
          path = await copyInto(
            root,
            lecture.course_id,
            source,
            'transcripts',
            await directory('语音原文', lecture.course_id),
          );
        db.db
          .prepare(
            'UPDATE lectures SET transcript_path=?,transcript_text=?,time_estimated=?,status=? WHERE id=?',
          )
          .run(path, original.text, original.estimated ? 1 : 0, '待校订', lecture.id);
        db.db.prepare('DELETE FROM correction_checkpoints WHERE lecture_id=?').run(lecture.id);
        db.db.prepare('DELETE FROM subtitles WHERE lecture_id=?').run(lecture.id);
        db.db.prepare('DELETE FROM lecture_notes WHERE lecture_id=?').run(lecture.id);
        db.db.prepare('DELETE FROM practice_sets WHERE lecture_id=?').run(lecture.id);
        return db.lectureDetail(lecture.id);
      },
      'lecture:courseware': async () => {
        const lecture = db.lecture(id()),
          source = z.string().min(1).parse(object.path),
          parsed = await parseCourseware(source);
        if (parsed.needsOcr) throw new Error('课件是扫描件，需要先 OCR 为文本 PDF');
        const path = await copyInto(
          root,
          lecture.course_id,
          source,
          'courseware',
          await directory('PPT', lecture.course_id),
        );
        db.db
          .prepare('UPDATE lectures SET ppt_path=?,ppt_text=?,ppt_processed=0 WHERE id=?')
          .run(path, parsed.text, lecture.id);
        db.db.prepare('DELETE FROM correction_checkpoints WHERE lecture_id=?').run(lecture.id);
        db.db.prepare('DELETE FROM subtitles WHERE lecture_id=?').run(lecture.id);
        db.db.prepare('DELETE FROM lecture_notes WHERE lecture_id=?').run(lecture.id);
        db.db.prepare('DELETE FROM practice_sets WHERE lecture_id=?').run(lecture.id);
        return db.lectureDetail(lecture.id);
      },
      'lecture:detail': async () => db.lectureDetail(id()),
    };
  });
}
