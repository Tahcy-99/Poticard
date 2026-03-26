<script setup>
import { defineProps, defineEmits, ref } from 'vue'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'
import portfolioApi from '@/api/portfolio/index'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const quillRef = ref(null)

const imageHandler = () => {
  const input = document.createElement('input');
  input.setAttribute('type', 'file');
  input.setAttribute('accept', 'image/*');
  input.click();

  input.onchange = async () => {
    const file = input.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const uploadRes = await portfolioApi.uploadImage(formData);
      const s3Url = uploadRes.data?.result || uploadRes.result || uploadRes.data;

      if (!s3Url) {
        throw new Error("S3 URL을 받아오지 못했습니다.");
      }

      const quill = quillRef.value.getQuill();
      const range = quill.getSelection(true) || { index: quill.getLength() };
      
      quill.insertEmbed(range.index, 'image', s3Url);
      quill.setSelection(range.index + 1);

    } catch (error) {
      console.error('에디터 이미지 업로드 실패:', error);
      alert('이미지 업로드 중 오류가 발생했습니다.');
    }
  };
};

const customToolbar = {
  container: [
    ['bold', 'italic', 'underline', 'strike'],
    ['blockquote', 'code-block'],
    ['link', 'image', 'video', 'formula'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'list': 'check' }],
    [{ 'script': 'sub' }, { 'script': 'super' }],
    [{ 'indent': '-1' }, { 'indent': '+1' }],
    [{ 'direction': 'rtl' }],
    [{ 'size': ['small', false, 'large', 'huge'] }],
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'font': [] }],
    [{ 'align': [] }],
  ],
  handlers: {
    image: imageHandler
  }
};
</script>

<template>
  <QuillEditor 
    ref="quillRef"
    :content="modelValue"
    contentType="html"
    @update:content="emit('update:modelValue', $event)"
    :toolbar="customToolbar"
    placeholder="프로젝트의 주요 성과와 해결 과정을 작성해주세요" 
    theme="snow" 
  />
</template>

<style>
/* 기존 스타일 그대로 유지 */
.ql-container {
  height: auto !important;
}

.ql-editor {
  min-height: 400px;
  max-height: 4000px;
  overflow-y: auto;
}

.ql-toolbar {
  border-top-left-radius: 0.75rem;
  border-top-right-radius: 0.75rem;
  border-color: #e5e7eb;
}

.ql-container {
  border-bottom-left-radius: 0.75rem;
  border-bottom-right-radius: 0.75rem;
  border-color: #e5e7eb;
}

.ql-editor.ql-blank::before {
  color: #9ca3af !important;
  font-style: normal;
  opacity: 1;
}
</style>