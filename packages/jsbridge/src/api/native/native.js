import hybridJs from '../../hybrid';

export default function nativeMixin() {

    hybridJs.extendModule('nativeImage', [
        {
            namespace: 'create',
            os: ['syberos'],
            defaultParams: {
                src: '',
                width: 0,
                height: 0,
                offsetTop: 0,
                screenOffsetWidth: document.body.offsetWidth,
                screenOffsetHeight: document.body.offsetHeight
            }
        },
        {
            namespace: 'change',
            os: ['syberos'],
            defaultParams: {
                id: '',
                src: ''
            }
        },
        {
            namespace: 'remove',
            os: ['syberos'],
            defaultParams: {
                id: ''
            }
        },
        {
            namespace: 'removeAll',
            os: ['syberos']
        },
    ]);
}