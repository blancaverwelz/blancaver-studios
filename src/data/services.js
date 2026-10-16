/**
 * Service content for the "What I Do" section.
 *
 * @typedef {Object} Service
 * @property {string} num - Two-digit display number.
 * @property {string} title
 * @property {string} desc
 * @property {'gem'|'mark'|'ribbon'|'particles'} shape
 * @property {string} [benefitsId]
 */

/** @type {Service[]} */
export const services = [
  {
    num: "01",
    title: "Web Design & Development",
    desc: "Designing and building distinctive, responsive websites that combine thoughtful design with reliable performance—helping businesses communicate clearly, connect with customers, and grow.",
    shape: "gem",
    benefitsId: "web-design-development",
  },
  {
    num: "02",
    title: "Brand Identity",
    desc: "Crafting distinctive brand identities through logos, visual systems, typography, and design guidelines that communicate your story and leave a lasting impression.",
    shape: "mark",
    benefitsId: "brand-identity",
  },
  {
    num: "03",
    title: "Motion Design",
    desc: "Creating engaging animations, cinematic motion graphics, and interactive visuals that enhance storytelling, elevate user engagement, and bring digital experiences to life.",
    shape: "ribbon",
    benefitsId: "motion-design",
  },
  {
    num: "04",
    title: "3D & Interactive",
    desc: "Creating immersive 3D visuals and interactive WebGL experiences that invite exploration and bring brands to life through dynamic, real-time digital environments.",
    shape: "particles",
    benefitsId: "3d-interactive",
  },
];
