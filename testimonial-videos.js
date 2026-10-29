// Self-hosted derivatives; original landscape and portrait masters are preserved.
export const TESTIMONIAL_VIDEOS = {andy:'/assets/testimonials/andy-full.mp4',lukas:'/assets/testimonials/lukas-full.mp4'};
export function testimonialVideo(id){return matchMedia('(max-width: 700px)').matches?`/assets/testimonials/${id}-portrait.mp4`:TESTIMONIAL_VIDEOS[id];}
export function setupTestimonialLoops(root=document){
 if(!matchMedia('(max-width: 700px)').matches)return;
 root.querySelectorAll('.video-testimonial video[data-person]').forEach(video=>{const id=video.dataset.person;video.poster=`/assets/testimonials/${id}-portrait-poster.webp`;video.src=`/assets/testimonials/${id}-portrait-loop.mp4`;});
}
