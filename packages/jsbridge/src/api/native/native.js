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
                target: ''
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
    ]);
}